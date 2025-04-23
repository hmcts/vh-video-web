using System.IO;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System.Collections.Generic;
using System.Linq;
using Azure.Monitor.OpenTelemetry.Exporter;
using Microsoft.Extensions.Configuration.KeyPerFile;
using Microsoft.Extensions.FileProviders;

namespace VideoWeb;

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
            .ConfigureAppConfiguration(configBuilder =>
            {
                foreach (var filePath in keyVaults.Select(keyVault => $"/mnt/secrets/{keyVault}").Where(Directory.Exists))
                    configBuilder.Add(GetKeyPerFileSource(filePath));
            })
            .ConfigureWebHostDefaults(webBuilder =>
            {
                webBuilder.UseContentRoot(Directory.GetCurrentDirectory());
                webBuilder.UseIISIntegration();
                webBuilder.UseStartup<Startup>();
                webBuilder.ConfigureOpenTelemetryLogging();
                webBuilder.ConfigureAppConfiguration(configBuilder =>
                {
                    foreach (var filePath in keyVaults.Select(keyVault => $"/mnt/secrets/{keyVault}").Where(Directory.Exists))
                        configBuilder.Add(GetKeyPerFileSource(filePath));
                });
            });
    }

    private static void ConfigureOpenTelemetryLogging(this IWebHostBuilder webBuilder)
    {
        webBuilder.ConfigureLogging((hostingContext, logging) =>
        {
            logging.AddEventSourceLogger();
            logging.AddOpenTelemetry(options =>
            {
                options.IncludeFormattedMessage = true;
                options.ParseStateValues = true;
                options.IncludeScopes = true;
                options.AddAzureMonitorLogExporter(o => o.ConnectionString =
                    hostingContext.Configuration["ApplicationInsights:ConnectionString"]);
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
