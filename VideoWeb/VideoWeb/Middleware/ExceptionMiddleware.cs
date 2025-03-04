using System;
using System.Diagnostics;
using System.Net;
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
    public async Task InvokeAsync(HttpContext httpContext)
    {
        try
        {
            await next(httpContext);
        }
        catch (VideoApiException apiException)
        {
            await HandleExceptionAsync(httpContext, (HttpStatusCode)apiException.StatusCode, apiException, "Video API Client Exception");
        }
        catch (BookingsApiException apiException)
        {
            await HandleExceptionAsync(httpContext, (HttpStatusCode)apiException.StatusCode, apiException, "Bookings API Client Exception");
        }
        catch (BadRequestException ex)
        {
            await HandleExceptionAsync(httpContext, HttpStatusCode.BadRequest, ex, "400 Exception");
        }
        catch (OperationCanceledException ex)
        {
            await HandleExceptionAsync(httpContext, HttpStatusCode.RequestTimeout, ex, "Operation Cancelled Exception");
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(httpContext, HttpStatusCode.InternalServerError, ex, "App Exception");
        }
    }
    
    private async Task HandleExceptionAsync(HttpContext context, HttpStatusCode statusCode, Exception exception, string eventTitle)
    {
        TraceException(context, exception, eventTitle);
        
        logger.LogError(exception, "{EventTitle}: {Message}", eventTitle, exception.Message);

        if (context.Response.HasStarted)
        {
            Console.WriteLine("The response has already started, skipping error handling middleware.");
            return;
        }

        context.Response.StatusCode = (int)statusCode;
        var responseMessage = BuildExceptionMessage(exception);
        await context.Response.WriteAsJsonAsync(responseMessage);
    }
    
    //For structured logging
    private static void TraceException(HttpContext context, Exception exception, string eventTitle)
    {
        var activity = Activity.Current;
        if (activity == null) return;
        activity.DisplayName = eventTitle;
        activity.RecordException(exception);
        activity.SetStatus(ActivityStatusCode.Error);
        activity.SetTag("user", context.User.Identity?.Name ?? "Unknown");
        activity.SetTag("http.status_code", context.Response.StatusCode);
    }
    
    private static string BuildExceptionMessage(Exception exception)
    {
        var sb = new StringBuilder(exception.Message);
        var innerException = exception.InnerException;
        while (innerException != null)
        {
            sb.Append($" {innerException.Message}");
            innerException = innerException.InnerException;
        }
        return sb.ToString();
    }
}
