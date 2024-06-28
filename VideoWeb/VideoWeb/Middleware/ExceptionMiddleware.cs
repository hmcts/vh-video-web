using System;
using System.Collections.Generic;
using System.Net;
using System.Text;
using System.Threading.Tasks;
using BookingsApi.Client;
using Microsoft.AspNetCore.Http;
using VideoApi.Client;
using VideoWeb.Common;

namespace VideoWeb.Middleware
{
    public class ExceptionMiddleware
    {
        private readonly RequestDelegate _next;


        public ExceptionMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext httpContext)
        {
            try
            {
                await _next(httpContext);
            }
            catch (VideoApiException apiException)
            {
                var properties = new Dictionary<string, string> { { "response", apiException.Response } };
                ApplicationLogger.TraceException(TraceCategory.Dependency.ToString(), "Video API Client Exception",
                    apiException, null, properties);
                await HandleExceptionAsync(httpContext, (HttpStatusCode) apiException.StatusCode, apiException);
            }
            catch (BookingsApiException apiException)
            {
                var properties = new Dictionary<string, string> { { "response", apiException.Response } };
                ApplicationLogger.TraceException(TraceCategory.Dependency.ToString(), "Bookings API Client Exception",
                    apiException, null, properties);
                await HandleExceptionAsync(httpContext, (HttpStatusCode) apiException.StatusCode, apiException);
            }
            catch (BadRequestException ex)
            {
                ApplicationLogger.TraceException(TraceCategory.AppException.ToString(), "400 Exception", ex, null, null);
                await HandleExceptionAsync(httpContext, HttpStatusCode.BadRequest, ex);
            }
            catch (Exception ex)
            {
                ApplicationLogger.TraceException(TraceCategory.AppException.ToString(), "App Exception", ex, null, null);
                await HandleExceptionAsync(httpContext, HttpStatusCode.InternalServerError, ex);
            }
        }

        private Task HandleExceptionAsync(HttpContext context, HttpStatusCode statusCode, Exception exception)
        {
            context.Response.StatusCode = (int) statusCode;
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
}
