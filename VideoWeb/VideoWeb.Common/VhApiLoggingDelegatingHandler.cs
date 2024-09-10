using System;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.ApplicationInsights;
using Microsoft.Extensions.Logging;

namespace VideoWeb.Common;

public class VhApiLoggingDelegatingHandler : DelegatingHandler
{
    private readonly ILogger<VhApiLoggingDelegatingHandler> _logger;
    private readonly TelemetryClient _telemetryClient;
    
    public VhApiLoggingDelegatingHandler(ILogger<VhApiLoggingDelegatingHandler> logger,
        TelemetryClient telemetryClient)
    {
        _logger = logger;
        _telemetryClient = telemetryClient;
    }
    
    protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
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
            _logger.LogInformation("Request to {RequestUri}: {RequestBody}", request.RequestUri, requestBody);
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

        _telemetryClient.TrackRequest(requestTelemetry);

        return response;
    }
}
