using System;
using System.IO;
using System.Net;
using System.Threading.Tasks;
using BookingsApi.Client;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Moq;
using NUnit.Framework;
using NUnit.Framework.Legacy;
using VideoApi.Client;
using VideoWeb.Middleware;
using VideoWeb.Common;

namespace VideoWeb.UnitTests.Middleware
{
    [TestFixture]
    public class ExceptionMiddlewareTests
    {
        public Mock<IDelegateMock> RequestDelegateMock { get; set; }
        public ExceptionMiddleware ExceptionMiddleware { get; set; }
        public HttpContext _HttpContext { get; set; }
       

        [SetUp]
        public void ExceptionMiddleWareSetup()
        {
            RequestDelegateMock = new Mock<IDelegateMock>();
           _HttpContext = new DefaultHttpContext();
           _HttpContext.Response.Body = new MemoryStream();
        }

        [Test]
        public  async Task Should_Invoke_Delegate()
        {
            RequestDelegateMock
                .Setup(x => x.RequestDelegate(It.IsAny<HttpContext>()))
                .Returns(Task.FromResult(0));
            ExceptionMiddleware = new ExceptionMiddleware(RequestDelegateMock.Object.RequestDelegate);
            await ExceptionMiddleware.InvokeAsync(new DefaultHttpContext());
            RequestDelegateMock.Verify(x => x.RequestDelegate(It.IsAny<HttpContext>()), Times.Once);
        }

        [Test]
        public async Task Should_return_bad_request_message()
        {

            RequestDelegateMock
                .Setup(x => x.RequestDelegate(It.IsAny<HttpContext>()))
                .Returns(Task.FromException(new BadRequestException("Error")));
            ExceptionMiddleware = new ExceptionMiddleware(RequestDelegateMock.Object.RequestDelegate);


            await ExceptionMiddleware.InvokeAsync(_HttpContext);

            ClassicAssert.AreEqual((int)HttpStatusCode.BadRequest, _HttpContext.Response.StatusCode);
            _HttpContext.Response.ContentType.Should().Be("application/json; charset=utf-8");
        }

        [Test]
        public async Task Should_return_exception_message()
        {

            RequestDelegateMock
               .Setup(x => x.RequestDelegate(It.IsAny<HttpContext>()))
               .Returns(Task.FromException(new Exception()));
            ExceptionMiddleware = new ExceptionMiddleware(RequestDelegateMock.Object.RequestDelegate);

            
            await ExceptionMiddleware.InvokeAsync(_HttpContext);
            
            ClassicAssert.AreEqual((int)HttpStatusCode.InternalServerError, _HttpContext.Response.StatusCode);
            _HttpContext.Response.ContentType.Should().Be("application/json; charset=utf-8");
        }

        [Test]
        public async Task Should_return_nested_exception_messages()
        {
            var inner = new FormatException("Format issue");
            var exception = new FileNotFoundException("File issue", inner);
            RequestDelegateMock
                .Setup(x => x.RequestDelegate(It.IsAny<HttpContext>()))
                .Returns(Task.FromException(exception));
            ExceptionMiddleware = new ExceptionMiddleware(RequestDelegateMock.Object.RequestDelegate);
            
            await ExceptionMiddleware.InvokeAsync(_HttpContext);
            
            ClassicAssert.AreEqual((int)HttpStatusCode.InternalServerError, _HttpContext.Response.StatusCode);
            _HttpContext.Response.ContentType.Should().Be("application/json; charset=utf-8");
            
            _HttpContext.Response.Body.Seek(0, SeekOrigin.Begin);
            var body = await new StreamReader(_HttpContext.Response.Body).ReadToEndAsync();
            body.Should().Contain(exception.Message).And.Contain(inner.Message);
        }
        
        [Test]
        public async Task Should_return_status_code_and_message_from_bookings_api_exception()
        {
            var bookingsApiException = new BookingsApiException("Error", 400, "failed somewhere", null, null);
            RequestDelegateMock
                .Setup(x => x.RequestDelegate(It.IsAny<HttpContext>()))
                .Returns(Task.FromException(bookingsApiException));
            ExceptionMiddleware = new ExceptionMiddleware(RequestDelegateMock.Object.RequestDelegate);
            
            
            await ExceptionMiddleware.InvokeAsync(_HttpContext);
            
            ClassicAssert.AreEqual(bookingsApiException.StatusCode, _HttpContext.Response.StatusCode);
            _HttpContext.Response.ContentType.Should().Be("application/json; charset=utf-8");
        }
        
        [Test]
        public async Task Should_return_status_code_and_message_from_video_api_exception()
        {
            var bookingsApiException = new VideoApiException("Error", 400, "failed somewhere", null, null);
            RequestDelegateMock
                .Setup(x => x.RequestDelegate(It.IsAny<HttpContext>()))
                .Returns(Task.FromException(bookingsApiException));
            ExceptionMiddleware = new ExceptionMiddleware(RequestDelegateMock.Object.RequestDelegate);
            
            
            await ExceptionMiddleware.InvokeAsync(_HttpContext);
            
            ClassicAssert.AreEqual(bookingsApiException.StatusCode, _HttpContext.Response.StatusCode);
            _HttpContext.Response.ContentType.Should().Be("application/json; charset=utf-8");
        }
        
        public interface IDelegateMock
        {
            Task RequestDelegate(HttpContext context);
        }
    }
}
