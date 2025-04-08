using System.IO;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System.Collections.Generic;
using Microsoft.Extensions.Configuration.KeyPerFile;
using Microsoft.Extensions.FileProviders;
using OpenTelemetry.Logs;

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
            var keyVaults=new List<string> {
                "vh-bookings-api",
                "vh-infra-core",
                "vh-video-api",
                "vh-video-web"
            };

            
            return Host.CreateDefaultBuilder(args)
                .ConfigureAppConfiguration((configBuilder) =>
                {
                    foreach (var keyVault in keyVaults)
                    {
                        var filePath = $"/mnt/secrets/{keyVault}";
                        if (Directory.Exists(filePath))
                        {
                            configBuilder.Add(GetKeyPerFileSource(filePath));    
                        }
                    }
                })
                .ConfigureWebHostDefaults(webBuilder =>
                {
                    webBuilder.UseContentRoot(Directory.GetCurrentDirectory());
                    webBuilder.UseIISIntegration();
                    webBuilder.UseStartup<Startup>();
                    webBuilder.ConfigureLogging((hostingContext, logging) =>
                    {
                        logging.AddEventSourceLogger();
                        logging.AddOpenTelemetry();
                        logging.AddFilter<OpenTelemetryLoggerProvider>("", LogLevel.Trace);
                    });
                    webBuilder.ConfigureAppConfiguration(configBuilder =>
                    {
                        foreach (var keyVault in keyVaults)
                        {
                            var filePath = $"/mnt/secrets/{keyVault}";
                            if (Directory.Exists(filePath))
                            {
                                configBuilder.Add(GetKeyPerFileSource(filePath));    
                            }
                        }
                    });
                });
        }
        
        private static KeyPerFileConfigurationSource GetKeyPerFileSource(string filePath)
        {
            return new KeyPerFileConfigurationSource
            {
                FileProvider = new PhysicalFileProvider(filePath),
                Optional = true,
                ReloadOnChange = true,
                SectionDelimiter = "--" // Set your custom delimiter here
            };
        }
    }
}
