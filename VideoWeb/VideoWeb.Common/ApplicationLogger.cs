using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Security.Principal;
using Microsoft.Extensions.Logging;

namespace VideoWeb.Common
{
    /// <summary>
    /// The application logger class sends telemetry to OpenTelemetry.
    /// </summary>
    public static class ApplicationLogger
    {
        private static readonly ILogger Logger;
        private static readonly ActivitySource ActivitySource = new("VideoWeb.Common.ApplicationLogger");

        static ApplicationLogger()
        {
            using var loggerFactory = LoggerFactory.Create(builder =>
            {
                builder.AddOpenTelemetry(logging =>
                {
                    logging.IncludeFormattedMessage = true;
                    logging.IncludeScopes = true;
                });
            });

            Logger = loggerFactory.CreateLogger("ApplicationLogger");
        }

        public static void TraceException(string traceCategory, string eventTitle, Exception exception, IPrincipal user, IDictionary<string, string> properties)
        {
            ArgumentNullException.ThrowIfNull(exception);

            // Start an OpenTelemetry Activity (Span)
            using var activity = ActivitySource.StartActivity($"{traceCategory} {eventTitle}");

            if (activity != null)
            {
                activity.SetTag("event", $"{traceCategory} {eventTitle}");
                activity.SetTag("exception.type", exception.GetType().FullName);
                activity.SetTag("exception.message", exception.Message);
                activity.SetTag("exception.stacktrace", exception.StackTrace);

                if (user?.Identity?.Name is not null)
                {
                    activity.SetTag("user", user.Identity.Name);
                }

                if (properties != null)
                {
                    foreach (var entry in properties)
                    {
                        activity.SetTag(entry.Key, entry.Value);
                    }
                }

                activity.SetStatus(ActivityStatusCode.Error);
            }

            // Log exception with ILogger
            var formattedMessage = $"{traceCategory} - {eventTitle}: {exception.Message}";
            Logger.LogError(exception, formattedMessage);
        }
    }
}
