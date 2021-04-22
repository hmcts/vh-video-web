using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http.Connections;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.Logging;
using VideoWeb.Common.Configuration;
using VideoWeb.Common.Security.HashGen;
using VideoWeb.Extensions;
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
            services.AddSwagger();
            services.AddJsonOptions();
            RegisterSettings(services);

            services.AddCustomTypes();

            services.RegisterAuthSchemes(Configuration);
            services.AddMvc(opt => opt.Filters.Add(typeof(LoggingMiddleware)));
            services.AddMvc().AddFluentValidation();
            services.AddApplicationInsightsTelemetry(Configuration["ApplicationInsights:InstrumentationKey"]);
            // In production, the Angular files will be served from this directory
            services.AddSpaStaticFiles(configuration => { configuration.RootPath = "ClientApp/dist"; });
        }

        private void RegisterSettings(IServiceCollection services)
        {
            Settings = Configuration.Get<Settings>();
            services.AddSingleton(Settings);

            services.Configure<AzureAdConfiguration>(options =>
            {
                Configuration.Bind("AzureAd", options);
                options.ApplicationInsights = new ApplicationInsightsConfiguration();
                Configuration.Bind("ApplicationInsights", options.ApplicationInsights);
            });

            services.Configure<EJudAdConfiguration>(options =>
            {
                Configuration.Bind("EJudAd", options);
                options.ApplicationInsights = new ApplicationInsightsConfiguration();
                Configuration.Bind("ApplicationInsights", options.ApplicationInsights);
            });

            var customTokenSettings = Configuration.GetSection("KinlyConfiguration").Get<KinlyConfiguration>();
            services.AddSingleton(customTokenSettings);

            var connectionStrings = Configuration.GetSection("ConnectionStrings").Get<ConnectionStrings>();
            services.AddSingleton(connectionStrings);
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
                IdentityModelEventSource.ShowPII = true;
            }
            else
            {
                app.UseExceptionHandler("/Error");

                if (!Settings.DisableHttpsRedirection)
                {
                    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
                    app.UseHsts();
                    app.UseHttpsRedirection();
                }
            }

            if (!env.IsDevelopment() || Settings.ZapScan)
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

                var hubPath = Configuration.GetValue<string>("VhServices:EventHubPath");
                endpoints.MapHub<EventHub.Hub.EventHub>(hubPath, options =>
                {
                    options.Transports = HttpTransportType.ServerSentEvents | HttpTransportType.LongPolling |
                                         HttpTransportType.WebSockets;
                });
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
