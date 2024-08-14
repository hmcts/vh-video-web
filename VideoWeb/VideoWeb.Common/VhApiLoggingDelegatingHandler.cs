using System;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.ApplicationInsights;
using Microsoft.Extensions.Logging;

namespace VideoWeb.Common;

public class VhApiLoggingDelegatingHandler(
    ILogger<VhApiLoggingDelegatingHandler> logger,
    TelemetryClient telemetryClient)
    : DelegatingHandler
{
    protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken = default)
    {
        var requestTelemetry = new Microsoft.ApplicationInsights.DataContracts.RequestTelemetry
        {
            Name = $"HTTP {request.Method} {request.RequestUri}",
            Url = request.RequestUri,
            Timestamp = DateTimeOffset.Now
        };

        // Log request body if it exists
        if (request.Content != null)
        {
            var requestBody = await request.Content.ReadAsStringAsync(cancellationToken);
            requestTelemetry.Properties.Add("VHApiRequestBody", requestBody);
            logger.LogInformation("Request to {RequestUri}: {RequestBody}", request.RequestUri, requestBody);
        }
        var stopwatch = System.Diagnostics.Stopwatch.StartNew();
        // Proceed with the request
        var response = await base.SendAsync(request, cancellationToken);

        stopwatch.Stop();
        requestTelemetry.Duration = stopwatch.Elapsed;
        requestTelemetry.ResponseCode = response.StatusCode.ToString();
        requestTelemetry.Success = response.IsSuccessStatusCode;
        var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);
        requestTelemetry.Properties.Add("VHApiResponseBody", responseBody);

        telemetryClient.TrackRequest(requestTelemetry);

        return response;
    }
}
