using System.Diagnostics;
using System.Diagnostics.CodeAnalysis;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using VideoWeb.Common.Logging;

namespace VideoWeb.Common;

[ExcludeFromCodeCoverage]
public class VhApiLoggingDelegatingHandler(ILogger<VhApiLoggingDelegatingHandler> logger) : DelegatingHandler
{
    private readonly ActivitySource _httpActivitySource = new("VhApiLoggingHandler");
    protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        using var activity = _httpActivitySource.StartActivity(ActivityKind.Client);
        activity?.SetTag("http.method", request.Method);
        activity?.SetTag("http.url", request.RequestUri);
        
        if (request.Content != null)
        {
            var requestBody = await request.Content.ReadAsStringAsync(cancellationToken);
            activity?.SetTag("http.request.body", requestBody);
            logger.LogRequestDetails(request.RequestUri.AbsoluteUri, requestBody);
        }
        
        var response = await base.SendAsync(request, cancellationToken);
        
        activity?.SetTag("http.status_code", (int)response.StatusCode);
        activity?.SetTag("http.success", response.IsSuccessStatusCode);
        
        return response;
    }
}
