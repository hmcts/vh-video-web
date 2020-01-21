using Microsoft.AspNetCore;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Logging;

namespace VideoWeb
{
    internal static class Program
    {
        public static void Main(string[] args)
        {
            CreateWebHostBuilder(args).Build().Run();
        }

        public static IWebHostBuilder CreateWebHostBuilder(string[] args) =>
            WebHost.CreateDefaultBuilder(args)
                .UseKestrel(x => x.AddServerHeader = false)
                .ConfigureLogging((hostingContext, logging) =>
                {
                    logging.AddEventSourceLogger();
                    logging.AddFilter<Microsoft.Extensions.Logging.ApplicationInsights.ApplicationInsightsLoggerProvider>
                             ("", LogLevel.Trace);
                })
                .UseStartup<Startup>();
    }
}