using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;

namespace VideoWeb.Middleware
{
    public class SignalRTestingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly Random _random;

        public int Seed { get; set; }
        public float PercentToBlock { get; set; }

        public SignalRTestingMiddleware(RequestDelegate next, int? seed=null, float percentToBlock=80.0f)
        {
            PercentToBlock = percentToBlock;
            Seed = seed.HasValue ? seed.Value : DateTime.Now.Day * DateTime.Now.Millisecond;

            _next = next;
            _random = new Random(Seed);
        }

        public async Task InvokeAsync(HttpContext httpContext)
        {
            if (httpContext.Request.Path.Value.Contains("config_signal_r_testing"))
            {
                float percentToBlock = 0;
                string value = httpContext.Request.Path.Value.Remove(0, "config_signal_r_testing".Length + 1);
                if (!float.TryParse(value, out percentToBlock))
                {
                    httpContext.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
                    await httpContext.Response.WriteAsync($"FAILED: to parse {value}; PercentToBlock={PercentToBlock}");
                    return;
                }

                PercentToBlock = percentToBlock;
                httpContext.Response.StatusCode = (int)HttpStatusCode.OK;
                await httpContext.Response.WriteAsync($"PercentToBlock={PercentToBlock}");
            }

            if (httpContext.Request.Path.Value.Contains("eventhub"))
            {
                if (_random.NextDouble() < PercentToBlock / 100.0f)
                {
                    httpContext.Response.StatusCode = (int)HttpStatusCode.NotFound;
                    await httpContext.Response.WriteAsync("SignalRTestingMiddleware");
                }
                else
                {
                    await _next(httpContext);
                }
            }
            else
            {
                await _next(httpContext);
            }
        }
    }
}
