using Microsoft.ApplicationInsights.Channel;
using Microsoft.ApplicationInsights.Extensibility;
using Microsoft.AspNetCore.Http;

namespace VideoWeb.Common
{
    public class RequestTelemetry : ITelemetryInitializer
    {
        readonly IHttpContextAccessor _httpContextAccessor;

        public RequestTelemetry(IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        public void Initialize(ITelemetry telemetry)
        {
            telemetry.Context.Cloud.RoleName = "vh-video-web";
            
            if (!(telemetry is Microsoft.ApplicationInsights.DataContracts.RequestTelemetry requestTelemetry))
            {
                return;
            }

            if (!IsReadableBadRequest(requestTelemetry))
            {
                return;
            }

            // Check response body
            var responseBody = (string) _httpContextAccessor.HttpContext.Items["responseBody"];
            if (responseBody != null)
            {
                requestTelemetry.Properties.Add("responseBody", responseBody);
            }
        }

        private bool IsReadableBadRequest(Microsoft.ApplicationInsights.DataContracts.RequestTelemetry telemetry)
        {
            return _httpContextAccessor.HttpContext.Request.Body.CanRead
                   && telemetry.ResponseCode == "400";
        }
    }
}