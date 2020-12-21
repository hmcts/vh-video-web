using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Logging;
using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;
using VideoWeb.Common.Helpers;

namespace VideoWeb.Middleware
{
    public class LoggingMiddleware : IAsyncActionFilter
    {
        private readonly ILogger<LoggingMiddleware> _logger;

        private readonly ILoggingDataExtractor _loggingDataExtractor;

        public LoggingMiddleware(ILogger<LoggingMiddleware> logger, ILoggingDataExtractor loggingDataExtractor)
        {
            _logger = logger;
            _loggingDataExtractor = loggingDataExtractor;
        }

        public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
            var properties = context.ActionDescriptor.Parameters
                .Select(p => context.ActionArguments.SingleOrDefault(x => x.Key == p.Name))
                .SelectMany(pv => _loggingDataExtractor.ConvertToDictionary(pv.Value, pv.Key))
                .ToDictionary(x => x.Key, x => x.Value);

            if (context.ActionDescriptor is ControllerActionDescriptor actionDescriptor)
            {
                properties.Add(nameof(actionDescriptor.ControllerName), actionDescriptor.ControllerName);
                properties.Add(nameof(actionDescriptor.ActionName), actionDescriptor.ActionName);
                properties.Add(nameof(actionDescriptor.DisplayName), actionDescriptor.DisplayName);
            }

            using (_logger.BeginScope(properties))
            {
                _logger.LogDebug("Starting request");
                var sw = Stopwatch.StartNew();
                var action = await next();
                if (action.Exception != null)
                {
                    var ex = action.Exception;
                    _logger.LogError(ex, ex.Message);
                }

                _logger.LogDebug("Handled request in {ElapsedMilliseconds}ms", sw.ElapsedMilliseconds);
            }
        }
    }
}

