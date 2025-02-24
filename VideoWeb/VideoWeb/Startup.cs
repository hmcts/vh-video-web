using System;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http.Connections;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.Logging;
using VideoWeb.Common;
using VideoWeb.Common.Configuration;
using VideoWeb.Common.Security.HashGen;
using VideoWeb.Extensions;
using VideoWeb.Health;
using VideoWeb.Middleware;

namespace VideoWeb
{
    public class Startup
    {
        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        public IConfiguration Configuration { get; }

        private Settings Settings { get; set; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            var envName = Configuration["AzureAd:PostLogoutRedirectUri"]; 
            var sdkKey = Configuration["LaunchDarkly:SdkKey"];
            var featureToggles = new FeatureToggles(sdkKey, envName);
            services.AddSingleton<IFeatureToggles>(featureToggles);

            services.AddSwagger();
            services.AddHsts(options =>
            {
                options.IncludeSubDomains = true;
                options.MaxAge = TimeSpan.FromDays(365);
            });
            services.AddJsonOptions();
            RegisterSettings(services);

            services.AddCustomTypes();

            services.RegisterAuthSchemes(Configuration);
            services.AddMvc(opt =>
                {
                    opt.Filters.Add(typeof(LoggingMiddleware));
                    opt.Filters.Add(new ProducesResponseTypeAttribute(typeof(string), 500));
                    opt.Filters.Add(new ProducesResponseTypeAttribute(typeof(string), 504));
                });
            services.AddFluentValidationAutoValidation().AddFluentValidationClientsideAdapters();
            services.AddApplicationInsightsTelemetry();
            if (featureToggles.AppInsightsProfilingEnabled())
            {
                services.AddServiceProfiler();
            }

            // In production, the Angular files will be served from this directory
            services.AddSpaStaticFiles(configuration => { configuration.RootPath = "ClientApp/dist"; });
        }

        private void RegisterSettings(IServiceCollection services)
        {
            Settings = Configuration.Get<Settings>();
            services.AddSingleton(Settings);
            services.Configure<HearingServicesConfiguration>(options => Configuration.Bind("VhServices", options));
            services.Configure<AzureAdConfiguration>(options =>
            {
                Configuration.Bind("AzureAd", options);
                options.ApplicationInsights = new ApplicationInsightsConfiguration();
                Configuration.Bind("ApplicationInsights", options.ApplicationInsights);
            });
            services.Configure<EJudAdConfiguration>(options =>
            {
                Configuration.Bind("EJudAd", options);
            });
            
            services.Configure<Dom1AdConfiguration>(options =>
            {
                Configuration.Bind(Dom1AdConfiguration.ConfigSectionKey, options);
            });

            services.Configure<QuickLinksConfiguration>(options =>
            {
                Configuration.Bind("QuickLinks", options);
            });

            services.Configure<RedisConfiguration>(options =>
            {
                Configuration.Bind("RedisConfiguration", options);
            });

            services.Configure<DynatraceConfiguration>(options =>
            {
                Configuration.Bind("DynatraceConfiguration", options);
            });
            
            services.Configure<CacheSettings>(options =>
            {
                Configuration.Bind("CacheSettings", options);
            });

            var vodafoneTokenSettings = Configuration.GetSection("VodafoneConfiguration").Get<VodafoneConfiguration>();
            services.Configure<VodafoneConfiguration>(Configuration.GetSection("VodafoneConfiguration"));
            services.AddSingleton(vodafoneTokenSettings);

            var redis = Configuration.GetSection("RedisConfiguration").Get<RedisConfiguration>();
            services.AddSingleton(redis);

            var dynatrace = Configuration.GetSection("DynatraceConfiguration").Get<DynatraceConfiguration>();
            services.AddSingleton(dynatrace);

            var connectionStrings = Configuration.GetSection("ConnectionStrings").Get<ConnectionStrings>();
            services.AddSingleton(connectionStrings);
            
            var cacheSettings = Configuration.GetSection("CacheSettings").Get<CacheSettings>();
            services.AddSingleton(cacheSettings);
  
            services.AddVhHealthChecks();
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            app.SeedCacheWithReferenceData();
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

                if (!Settings.DisableHttpsRedirection)
                {
                    app.UseHttpsRedirection();
                }
            }

            app.UseHsts();
            // this is a workaround to set HSTS in a docker
            // reference from https://github.com/dotnet/dotnet-docker/issues/2268#issuecomment-714613811
            app.Use(async (context, next) => {
                if (!context.Response.Headers.ContainsKey("Strict-Transport-Security"))
                {
                    context.Response.Headers["Strict-Transport-Security"] = "max-age=31536000";
                }
                await next.Invoke();
            });

            if (!env.IsDevelopment() || Settings.ZapScan)
            {
                app.UseSpaStaticFiles();
            }
            IdentityModelEventSource.ShowPII = true;
            app.UseRouting();
            app.UseAuthentication();
            app.UseAuthorization();
            app.UseMiddleware<RequestBodyLoggingMiddleware>();
            app.UseMiddleware<ExceptionMiddleware>();

            app.UseEndpoints(endpoints =>
            {
                endpoints.MapDefaultControllerRoute();

                var hubPath = Configuration.GetValue<string>("VhServices:EventHubPath");
                endpoints.MapHub<EventHub.Hub.EventHub>(hubPath, options =>
                {
                    options.Transports = HttpTransportType.ServerSentEvents | HttpTransportType.LongPolling |
                                         HttpTransportType.WebSockets;
                });

                endpoints.AddVhHealthCheckRouteMaps();
            });

            app.UseSpa(spa =>
            {
                // To learn more about options for serving an Angular SPA from ASP.NET Core,
                // see https://go.microsoft.com/fwlink/?linkid=864501

                if (env.IsDevelopment() && !Settings.ZapScan)
                {
                    var ngBaseUri = Configuration.GetValue<string>("VhServices:NgBaseUri");
                    spa.UseProxyToSpaDevelopmentServer(ngBaseUri);
                }
            });
        }
    }
}
