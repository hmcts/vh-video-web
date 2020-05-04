using System;
using System.Collections.Generic;
using System.Security.Principal;
using Microsoft.ApplicationInsights;
using Microsoft.ApplicationInsights.DataContracts;
using Microsoft.ApplicationInsights.Extensibility;
using Newtonsoft.Json;

namespace VideoWeb.Common
{
    /// <summary>
    /// The application logger class send telemetry to Application Insights.
    /// </summary>
    public static class ApplicationLogger
    {
        private static readonly TelemetryClient TelemetryClient = InitTelemetryClient();
        
        private static TelemetryClient InitTelemetryClient() {
            var config = TelemetryConfiguration.CreateDefault();
            var client = new TelemetryClient(config);
            return client;
        }

        public static void Trace(string traceCategory, string eventTitle, string information)
        {
            var telemetryTrace = new TraceTelemetry(traceCategory, SeverityLevel.Information);
            telemetryTrace.Properties.Add("Information", information);
            telemetryTrace.Properties.Add("Event", eventTitle);
            TelemetryClient.TrackTrace(telemetryTrace);
        }

        public static void TraceWithProperties(string traceCategory, string eventTitle, string user, IDictionary<string, string> properties)
        {
            var telemetryTrace = new TraceTelemetry(traceCategory, SeverityLevel.Information);

            telemetryTrace.Properties.Add("Event", eventTitle);

            telemetryTrace.Properties.Add("User", user);

            if (properties != null)
            {
                foreach (KeyValuePair<string, string> entry in properties)
                {
                    telemetryTrace.Properties.Add(entry.Key, entry.Value);
                }
            }

            TelemetryClient.TrackTrace(telemetryTrace);
          
        }
   
        public static void TraceWithProperties(string traceCategory, string eventTitle, string user)
        {
            TraceWithProperties(traceCategory, eventTitle, user, null);
        }

        public static void TraceWithObject(string traceCategory, string eventTitle, string user, object valueToSerialized)
        {
            var telemetryTrace = new TraceTelemetry(traceCategory, SeverityLevel.Information);

            telemetryTrace.Properties.Add("Event", eventTitle);

            telemetryTrace.Properties.Add("User", user);

            if (valueToSerialized != null)
            {
                telemetryTrace.Properties.Add(valueToSerialized.GetType().Name, JsonConvert.SerializeObject(valueToSerialized, Formatting.None));
            }

            TelemetryClient.TrackTrace(telemetryTrace);
        }

        public static void TraceWithObject(string traceCategory, string eventTitle, string user)
        {
            TraceWithObject(traceCategory, eventTitle, user, null);
        }

        public static void TraceException(string traceCategory, string eventTitle, Exception exception, IPrincipal user, IDictionary<string, string> properties)
        {
            if (exception == null)
            {
                throw new ArgumentNullException(nameof(exception));
            }

            var telemetryException = new ExceptionTelemetry(exception);

            telemetryException.Properties.Add("Event", traceCategory + " " + eventTitle);

            if (user != null && user.Identity != null)
            {
                telemetryException.Properties.Add("User", user.Identity.Name);
            }

            if (properties != null)
            {
                foreach (KeyValuePair<string, string> entry in properties)
                {
                    telemetryException.Properties.Add(entry.Key, entry.Value);
                }
            }

            TelemetryClient.TrackException(telemetryException);
        }

        public static void TraceException(string traceCategory, string eventTitle, Exception exception, IPrincipal user)
        {
            TraceException(traceCategory, eventTitle, exception, user, null);
        }

        public static void TraceEvent(string eventTitle, IDictionary<string, string> properties)
        {
            var telemetryEvent = new EventTelemetry(eventTitle);

            if (properties != null)
            {
                foreach (KeyValuePair<string, string> entry in properties)
                {
                    telemetryEvent.Properties.Add(entry.Key, entry.Value);
                }
            }

            TelemetryClient.TrackEvent(telemetryEvent);
        }

        public static void TraceRequest(string operationName, DateTimeOffset startTime, TimeSpan duration, string responseCode, bool success)
        {
            var telemetryOperation = new Microsoft.ApplicationInsights.DataContracts.RequestTelemetry(operationName, startTime, duration, responseCode, success);
            TelemetryClient.TrackRequest(telemetryOperation);
        }
    }
}
