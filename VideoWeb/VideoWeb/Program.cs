using System.IO;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using VH.Core.Configuration;

namespace VideoWeb
{
    internal static class Program
    {
        public static void Main(string[] args)
        {
            CreateWebHostBuilder(args).Build().Run();


        }

        private static IHostBuilder CreateWebHostBuilder(string[] args)
        {
            const string vhInfraCore = "/mnt/secrets/vh-infra-core";
            const string vhVideoWeb = "/mnt/secrets/vh-video-web";

            return Host.CreateDefaultBuilder(args)
                .ConfigureAppConfiguration((configBuilder) =>
                {
                    configBuilder.AddAksKeyVaultSecretProvider(vhInfraCore);
                    configBuilder.AddAksKeyVaultSecretProvider(vhVideoWeb);
                })
                .ConfigureWebHostDefaults(webBuilder =>
                {
                    webBuilder.UseContentRoot(Directory.GetCurrentDirectory());
                    webBuilder.UseIISIntegration();
                    webBuilder.UseStartup<Startup>();
                    webBuilder.ConfigureLogging((hostingContext, logging) =>
                    {
                        logging.AddEventSourceLogger();
                        logging
                            .AddFilter<Microsoft.Extensions.Logging.ApplicationInsights.
                                    ApplicationInsightsLoggerProvider>
                                ("", LogLevel.Trace);
                    });
                    webBuilder.ConfigureAppConfiguration(configBuilder =>
                    {
                        configBuilder.AddAksKeyVaultSecretProvider(vhInfraCore);
                        configBuilder.AddAksKeyVaultSecretProvider(vhVideoWeb);
                    });
                });
        }
    }
}
