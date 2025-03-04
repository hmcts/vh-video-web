using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Net;
using System.Security.Principal;
using System.Text;
using System.Threading.Tasks;
using BookingsApi.Client;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using OpenTelemetry.Trace;
using VideoApi.Client;
using VideoWeb.Common;

namespace VideoWeb.Middleware;

public class ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)
{
    private static readonly ActivitySource ActivitySource = new("ExceptionHandlingMiddleware");
    
    public async Task InvokeAsync(HttpContext httpContext)
    {
        try
        {
            await next(httpContext);
        }catch (VideoApiException apiException)
        
        {
            var properties = new Dictionary<string, string> { { "response", apiException.Response } };
            TraceException(TraceCategory.Dependency.ToString(), "Video API Client Exception",
                apiException, null, properties);
            await HandleExceptionAsync(httpContext, (HttpStatusCode)apiException.StatusCode, apiException);
        }
        catch (BookingsApiException apiException)
        {
            var properties = new Dictionary<string, string> { { "response", apiException.Response } };
            TraceException(TraceCategory.Dependency.ToString(), "Bookings API Client Exception", apiException, null, properties);
            await HandleExceptionAsync(httpContext, (HttpStatusCode)apiException.StatusCode, apiException);
        }
        catch (BadRequestException ex)
        {
            TraceException(TraceCategory.AppException.ToString(), "400 Exception", ex, null, null);
            await HandleExceptionAsync(httpContext, HttpStatusCode.BadRequest, ex);
        }
        catch (OperationCanceledException ex)
        {
            TraceException(TraceCategory.OperationCancelled.ToString(), "Operation Cancelled Exception", ex, httpContext.User, null);
            await HandleExceptionAsync(httpContext, HttpStatusCode.RequestTimeout, ex);
        }
        catch (Exception ex)
        {
            TraceException(TraceCategory.AppException.ToString(), "App Exception", ex, null, null);
            await HandleExceptionAsync(httpContext, HttpStatusCode.InternalServerError, ex);
        }
    }
    
    private void TraceException(string traceCategory, string eventTitle, Exception exception, IPrincipal user, IDictionary<string, string> properties)
    {
        using var activity = ActivitySource.StartActivity($"{traceCategory} {eventTitle}");
        
        if (activity != null)
        {
            activity.SetTag("exception.type", exception.GetType().FullName);
            activity.SetTag("exception.message", exception.Message);
            activity.SetTag("exception.stacktrace", exception.StackTrace);
            
            if (user?.Identity?.Name is not null)
            {
                activity.SetTag("user", user.Identity.Name);
            }
            
            if (properties != null)
            {
                foreach (var entry in properties)
                {
                    activity.SetTag(entry.Key, entry.Value);
                }
            }
            
            activity.RecordException(exception);
            activity.SetStatus(ActivityStatusCode.Error);
        }
        var formattedMessage = $"{traceCategory} - {eventTitle}: {exception.Message}";
        logger.LogError(exception, formattedMessage);
    }
    
    private static Task HandleExceptionAsync(HttpContext context, HttpStatusCode statusCode, Exception exception)
    {
        if (context.Response.HasStarted)
        {
            Console.WriteLine("The response has already started, the error handling middleware will not be executed.");
            return Task.CompletedTask;
        }
        context.Response.StatusCode = (int)statusCode;
        var sb = new StringBuilder(exception.Message);
        var innerException = exception.InnerException;
        while (innerException != null)
        {
            sb.Append($" {innerException.Message}");
            innerException = innerException.InnerException;
        }
        return context.Response.WriteAsJsonAsync(sb.ToString());
    }
}
