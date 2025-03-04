using System.Diagnostics;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;

namespace VideoWeb.Common;

public class RequestTelemetryMiddleware(RequestDelegate next)
{
    public async Task Invoke(HttpContext context)
    {
        var activity = Activity.Current;
        if (activity != null)
        {
            activity.SetTag("cloud.role", "vh-video-web");
            if (context.Items.TryGetValue("responseBody", out var body))
            {
                activity.SetTag("response.body", body);
            }
        }
        
        await next(context);
    }
}
