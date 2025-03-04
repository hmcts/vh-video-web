using System;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using BookingsApi.Client;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using NUnit.Framework.Legacy;
using VideoApi.Client;
using VideoWeb.Middleware;
using VideoWeb.Common;

namespace VideoWeb.UnitTests.Middleware;

[TestFixture]
public class ExceptionMiddlewareTests
{
    private Mock<ILogger<ExceptionMiddleware>> _logger;
    private Mock<IDelegateMock> RequestDelegateMock { get; set; }
    private ExceptionMiddleware ExceptionMiddleware { get; set; }
    private HttpContext HttpContext { get; set; }
    
    
    [SetUp]
    public void ExceptionMiddleWareSetup()
    {
        _logger = new Mock<ILogger<ExceptionMiddleware>>();
        RequestDelegateMock = new Mock<IDelegateMock>();
        HttpContext = new DefaultHttpContext();
        HttpContext.Response.Body = new MemoryStream();
    }
    
    [Test]
    public  async Task Should_Invoke_Delegate()
    {
        RequestDelegateMock
            .Setup(x => x.RequestDelegate(It.IsAny<HttpContext>()))
            .Returns(Task.FromResult(0));
        ExceptionMiddleware = new ExceptionMiddleware(RequestDelegateMock.Object.RequestDelegate, _logger.Object);
        await ExceptionMiddleware.InvokeAsync(new DefaultHttpContext());
        RequestDelegateMock.Verify(x => x.RequestDelegate(It.IsAny<HttpContext>()), Times.Once);
    }
    
    [Test]
    public async Task Should_create_activity_span_for_structure_logging()
    {
        var customErrorMessage = "Custom Error Message";
        using var activity = new Activity("TestActivity").Start();
        Activity.Current = activity;
        
        RequestDelegateMock
            .Setup(x => x.RequestDelegate(It.IsAny<HttpContext>()))
            .Returns(Task.FromException(new BadRequestException(customErrorMessage)));
        ExceptionMiddleware = new ExceptionMiddleware(RequestDelegateMock.Object.RequestDelegate, _logger.Object);
        
        await ExceptionMiddleware.InvokeAsync(HttpContext);
        
        activity.DisplayName.Should().Be("400 Exception");
        activity.Tags.Should().ContainKey("user").WhoseValue.Should().Be("Unknown");
        var exceptionTags = activity.Events.First(e => e.Name == "exception").Tags;
        exceptionTags.Should().ContainKey("exception.message").WhoseValue.Should().Be(customErrorMessage);
    }
    
    [Test]
    public async Task Should_return_bad_request_message()
    {
        
        RequestDelegateMock
            .Setup(x => x.RequestDelegate(It.IsAny<HttpContext>()))
            .Returns(Task.FromException(new BadRequestException("Error")));
        ExceptionMiddleware = new ExceptionMiddleware(RequestDelegateMock.Object.RequestDelegate, _logger.Object);
        
        
        await ExceptionMiddleware.InvokeAsync(HttpContext);
        
        ClassicAssert.AreEqual((int)HttpStatusCode.BadRequest, HttpContext.Response.StatusCode);
        HttpContext.Response.ContentType.Should().Be("application/json; charset=utf-8");
    }
    
    [Test]
    public async Task Should_return_exception_message()
    {
        
        RequestDelegateMock
            .Setup(x => x.RequestDelegate(It.IsAny<HttpContext>()))
            .Returns(Task.FromException(new Exception()));
        ExceptionMiddleware = new ExceptionMiddleware(RequestDelegateMock.Object.RequestDelegate, _logger.Object);
        
        
        await ExceptionMiddleware.InvokeAsync(HttpContext);
        
        ClassicAssert.AreEqual((int)HttpStatusCode.InternalServerError, HttpContext.Response.StatusCode);
        HttpContext.Response.ContentType.Should().Be("application/json; charset=utf-8");
    }
    
    [Test]
    public async Task Should_return_nested_exception_messages()
    {
        var inner = new FormatException("Format issue");
        var exception = new FileNotFoundException("File issue", inner);
        RequestDelegateMock
            .Setup(x => x.RequestDelegate(It.IsAny<HttpContext>()))
            .Returns(Task.FromException(exception));
        ExceptionMiddleware = new ExceptionMiddleware(RequestDelegateMock.Object.RequestDelegate, _logger.Object);
        
        await ExceptionMiddleware.InvokeAsync(HttpContext);
        
        ClassicAssert.AreEqual((int)HttpStatusCode.InternalServerError, HttpContext.Response.StatusCode);
        HttpContext.Response.ContentType.Should().Be("application/json; charset=utf-8");
        
        HttpContext.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(HttpContext.Response.Body).ReadToEndAsync();
        body.Should().Contain(exception.Message).And.Contain(inner.Message);
    }
    
    [Test]
    public async Task Should_return_status_code_and_message_from_bookings_api_exception()
    {
        var bookingsApiException = new BookingsApiException("Error", 400, "failed somewhere", null, null);
        RequestDelegateMock
            .Setup(x => x.RequestDelegate(It.IsAny<HttpContext>()))
            .Returns(Task.FromException(bookingsApiException));
        ExceptionMiddleware = new ExceptionMiddleware(RequestDelegateMock.Object.RequestDelegate, _logger.Object);
        
        
        await ExceptionMiddleware.InvokeAsync(HttpContext);
        
        ClassicAssert.AreEqual(bookingsApiException.StatusCode, HttpContext.Response.StatusCode);
        HttpContext.Response.ContentType.Should().Be("application/json; charset=utf-8");
    }
    
    [Test]
    public async Task Should_return_status_code_and_message_from_video_api_exception()
    {
        var bookingsApiException = new VideoApiException("Error", 400, "failed somewhere", null, null);
        RequestDelegateMock
            .Setup(x => x.RequestDelegate(It.IsAny<HttpContext>()))
            .Returns(Task.FromException(bookingsApiException));
        ExceptionMiddleware = new ExceptionMiddleware(RequestDelegateMock.Object.RequestDelegate, _logger.Object);
        
        
        await ExceptionMiddleware.InvokeAsync(HttpContext);
        
        ClassicAssert.AreEqual(bookingsApiException.StatusCode, HttpContext.Response.StatusCode);
        HttpContext.Response.ContentType.Should().Be("application/json; charset=utf-8");
    }
    
    [Test]
    public async Task should_return_request_timeout_when_operation_cancelled_exception_is_thrown()
    {
        var exception = new OperationCanceledException("This is a test timeout exception");
        RequestDelegateMock
            .Setup(x => x.RequestDelegate(It.IsAny<HttpContext>()))
            .Returns(Task.FromException(exception));
        
        ExceptionMiddleware = new ExceptionMiddleware(RequestDelegateMock.Object.RequestDelegate, _logger.Object);
        
        await ExceptionMiddleware.InvokeAsync(HttpContext);
        HttpContext.Response.StatusCode.Should().Be((int)HttpStatusCode.RequestTimeout);
        HttpContext.Response.ContentType.Should().Be("application/json; charset=utf-8");
        
    }
    
    public interface IDelegateMock
    {
        Task RequestDelegate(HttpContext context);
    }
}
