using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http.Connections;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Authorization;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.Tokens;
using VideoWeb.Common.Configuration;
using VideoWeb.Common.Security;
using VideoWeb.Common.Security.HashGen;
using VideoWeb.Extensions;

namespace VideoWeb
{
    public class Startup
    {
        private const string EventHubPath = "/eventhub";
        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        public IConfiguration Configuration { get; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            services.AddSwagger();
            services.AddJsonOptions();
            RegisterSettings(services);

            services.AddCustomTypes();

            RegisterAuth(services);
            services.AddMvc().SetCompatibilityVersion(CompatibilityVersion.Version_3_0);
            services.AddApplicationInsightsTelemetry(Configuration["ApplicationInsights:InstrumentationKey"]);
            // In production, the Angular files will be served from this directory
            services.AddSpaStaticFiles(configuration => { configuration.RootPath = "ClientApp/dist"; });
        }

        private void RegisterSettings(IServiceCollection services)
        {

            services.Configure<AzureAdConfiguration>(options =>
            {
                Configuration.Bind("AzureAd", options);
                options.ApplicationInsights = new ApplicationInsightsConfiguration();
                Configuration.Bind("ApplicationInsights", options.ApplicationInsights);
            });
            services.Configure<HearingServicesConfiguration>(options => Configuration.Bind("VhServices", options));
            var customTokenSettings = Configuration.GetSection("KinlyConfiguration").Get<KinlyConfiguration>();
            services.AddSingleton(customTokenSettings);

            var connectionStrings = Configuration.GetSection("ConnectionStrings").Get<ConnectionStrings>();
            services.AddSingleton(connectionStrings);
        }

        private void RegisterAuth(IServiceCollection serviceCollection)
        {
            var kinlyConfiguration = Configuration.GetSection("KinlyConfiguration").Get<KinlyConfiguration>();
            var securitySettings = Configuration.GetSection("AzureAd").Get<AzureAdConfiguration>();
            var securityKey = Convert.FromBase64String(kinlyConfiguration.CallbackSecret);
            serviceCollection.AddAuthentication(options =>
                {
                    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
                }).AddPolicyScheme(JwtBearerDefaults.AuthenticationScheme, "handler", options =>
                    options.ForwardDefaultSelector = context =>
                        context.Request.Path.StartsWithSegments("/callback")
                            ? "Callback" : "default")
                .AddJwtBearer("default", options =>
                {
                    options.Authority = $"{securitySettings.Authority}{securitySettings.TenantId}";
                    options.TokenValidationParameters.ValidateLifetime = true;
                    options.Audience = securitySettings.ClientId;
                    options.TokenValidationParameters.ClockSkew = TimeSpan.Zero;
                    options.Events = new JwtBearerEvents {OnTokenValidated = OnTokenValidated};
                }).AddJwtBearer("EventHubUser", options =>
                {
                    options.Events = new JwtBearerEvents
                    {
                        OnMessageReceived = context =>
                        {
                            var accessToken = context.Request.Query["access_token"];
                            if (string.IsNullOrEmpty(accessToken)) return Task.CompletedTask;

                            var path = context.HttpContext.Request.Path;
                            if (path.StartsWithSegments(EventHubPath))
                            {
                                context.Token = accessToken;
                            }

                            return Task.CompletedTask;
                        },
                        OnTokenValidated = OnTokenValidated
                    };
                    options.Authority = $"{securitySettings.Authority}{securitySettings.TenantId}";
                    options.TokenValidationParameters = new TokenValidationParameters()
                    {
                        ClockSkew = TimeSpan.Zero,
                        ValidateLifetime = true,
                        ValidAudience = securitySettings.ClientId
                    };
                }).AddJwtBearer("Callback", options =>
                {
                    options.TokenValidationParameters = new TokenValidationParameters
                    {
                        ValidateIssuer = false,
                        ValidateAudience = false,
                        IssuerSigningKey = new SymmetricSecurityKey(securityKey)
                    };
                });

            serviceCollection.AddMemoryCache();
            serviceCollection.AddAuthorization(AddPolicies);
            serviceCollection.AddMvc(AddMvcPolicies);
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            if (!env.IsProduction())
            {
                app.UseSwagger();
                app.UseSwaggerUI(c => { c.SwaggerEndpoint("/swagger/v1/swagger.json", "Video Web App API V1"); });
            }

            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }
            else
            {
                app.UseExceptionHandler("/Error");
                // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
                app.UseHsts();
                app.UseHttpsRedirection();
            }

            if (!env.IsDevelopment())
            {
                app.UseSpaStaticFiles();
            }

            app.UseRouting();
            app.UseAuthorization();
            app.UseAuthentication();
            app.UseMiddleware<ExceptionMiddleware>();

            app.UseEndpoints(endpoints =>
            {
                endpoints.MapDefaultControllerRoute();

                endpoints.MapHub<EventHub.Hub.EventHub>(EventHubPath, options =>
                {
                    options.Transports = HttpTransportType.ServerSentEvents | HttpTransportType.LongPolling |
                                         HttpTransportType.WebSockets;
                });
            });

            app.UseSpa(spa =>
            {
                // To learn more about options for serving an Angular SPA from ASP.NET Core,
                // see https://go.microsoft.com/fwlink/?linkid=864501

                spa.Options.SourcePath = "ClientApp";

                bool spaProxy = String.IsNullOrEmpty(Configuration["spaProxy"]) ? false : bool.Parse(Configuration["spaProxy"]);

                if (spaProxy)
                {
                    string ngBaseUri = String.IsNullOrEmpty(Configuration["VhServices:VideoWebUrl"]) ? "http://localhost:4200/" : Configuration["VhServices:VideoWebUrl"];
                    spa.UseProxyToSpaDevelopmentServer(ngBaseUri);
                }
            });
        }

        private static void AddPolicies(AuthorizationOptions options)
        {
            options.DefaultPolicy = new AuthorizationPolicyBuilder()
                .RequireAuthenticatedUser().AddAuthenticationSchemes("default")
                .Build();

            options.AddPolicy("EventHubUser", new AuthorizationPolicyBuilder()
                .RequireAuthenticatedUser()
                .AddAuthenticationSchemes("EventHubUser")
                .Build());

            options.AddPolicy("Callback", new AuthorizationPolicyBuilder()
                .RequireAuthenticatedUser()
                .AddAuthenticationSchemes("Callback")
                .Build());
        }

        private static void AddMvcPolicies(MvcOptions options)
        {
            options.Filters.Add(new AuthorizeFilter(new AuthorizationPolicyBuilder()
                .RequireAuthenticatedUser().Build()));
        }
        
        private static async Task OnTokenValidated(TokenValidatedContext ctx)
        {
            if (ctx.SecurityToken is JwtSecurityToken jwtToken )
            {
                var claimsIdentity = ctx.Principal.Identity as ClaimsIdentity;
                if (!claimsIdentity.HasClaim(c => c.Type == ClaimTypes.Name))
                {
                    return;
                }
                var cachedUserClaimBuilder = ctx.HttpContext.RequestServices.GetService<ICachedUserClaimBuilder>();
                var userProfileClaims = await cachedUserClaimBuilder.BuildAsync(ctx.Principal.Identity.Name, jwtToken.RawData);
                
                claimsIdentity?.AddClaims(userProfileClaims);
            }
        }
    }
}
