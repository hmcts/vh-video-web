using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Logging;
using VideoWeb.Common.Helpers;
using VideoWeb.Common.Logging;

namespace VideoWeb.Middleware;

public class LoggingMiddleware(ILogger<LoggingMiddleware> logger, ILoggingDataExtractor loggingDataExtractor)
    : IAsyncActionFilter
{
    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var properties = context.ActionDescriptor.Parameters
            .Select(p => context.ActionArguments.SingleOrDefault(x => x.Key == p.Name))
            .SelectMany(pv => loggingDataExtractor.ConvertToDictionary(pv.Value, pv.Key))
            .ToDictionary(x => x.Key, x => x.Value);
        
        if (context.ActionDescriptor is ControllerActionDescriptor actionDescriptor)
        {
            properties.Add(nameof(actionDescriptor.ControllerName), actionDescriptor.ControllerName);
            properties.Add(nameof(actionDescriptor.ActionName), actionDescriptor.ActionName);
            properties.Add(nameof(actionDescriptor.DisplayName), actionDescriptor.DisplayName);
        }
        
        using (logger.BeginScope(properties))
        {
            logger.LogStartingRequest();
            var sw = Stopwatch.StartNew();
            var action = await next();
            if (action.Exception != null)
            {
                var ex = action.Exception;
                logger.LogRequestError(ex, ex.Message);
            }
            
            logger.LogHandledRequest(sw.ElapsedMilliseconds);
        }
    }
}
