using System.Diagnostics;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace VideoWeb.Common;

public class VhApiLoggingDelegatingHandler(ILogger<VhApiLoggingDelegatingHandler> logger) : DelegatingHandler
{
    protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        using var activity = Activity.Current ?? new Activity("HttpClientRequest").Start();
        activity.SetTag("http.method", request.Method);
        activity.SetTag("http.url", request.RequestUri);
        
        if (request.Content != null)
        {
            var requestBody = await request.Content.ReadAsStringAsync(cancellationToken);
            activity.SetTag("http.request.body", requestBody);
            logger.LogInformation("Request to {RequestUri}: {RequestBody}", request.RequestUri, requestBody);
        }
        
        var response = await base.SendAsync(request, cancellationToken);
        
        activity.SetTag("http.status_code", (int)response.StatusCode);
        activity.SetTag("http.success", response.IsSuccessStatusCode);
        
        return response;
    }
}
