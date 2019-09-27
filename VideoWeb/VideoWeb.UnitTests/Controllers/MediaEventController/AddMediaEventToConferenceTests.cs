using System;
using System.Net;
using System.Threading.Tasks;
using FizzWare.NBuilder;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using Testing.Common.Helpers;
using VideoWeb.Contract.Request;
using VideoWeb.Services.Video;
using ProblemDetails = VideoWeb.Services.Video.ProblemDetails;

namespace VideoWeb.UnitTests.Controllers.MediaEventController
{
    public class AddMediaEventToConferenceTests
    {
        private VideoWeb.Controllers.MediaEventController _controller;
        private Mock<IVideoApiClient> _videoApiClientMock;

        [SetUp]
        public void Setup()
        {
            _videoApiClientMock = new Mock<IVideoApiClient>();
            var claimsPrincipal = new ClaimsPrincipalBuilder().Build();
            var context = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = claimsPrincipal
                }
            };

            _controller = new VideoWeb.Controllers.MediaEventController(_videoApiClientMock.Object)
            {
                ControllerContext = context
            };
        }

        [Test]
        public async Task should_return_no_content_when_event_is_sent()
        {
            _videoApiClientMock
                .Setup(x => x.RaiseVideoEventAsync(It.IsAny<ConferenceEventRequest>()))
                .Returns(Task.FromResult(default(object)));

            var result = await _controller.AddMediaEventToConference(Guid.NewGuid(), Builder<AddMediaEventRequest>.CreateNew().Build());
            var typedResult = (NoContentResult)result;
            typedResult.Should().NotBeNull();
        }

        [Test]
        public async Task should_return_bad_request()
        {
            var apiException = new VideoApiException<ProblemDetails>("Bad Request", (int)HttpStatusCode.BadRequest,
                "Please provide a valid conference Id", null, default(ProblemDetails), null);
            _videoApiClientMock
                .Setup(x => x.RaiseVideoEventAsync(It.IsAny<ConferenceEventRequest>()))
                .ThrowsAsync(apiException);

            var result = await _controller.AddMediaEventToConference(Guid.NewGuid(), Builder<AddMediaEventRequest>.CreateNew().Build());
            var typedResult = (ObjectResult)result;
            typedResult.StatusCode.Should().Be((int)HttpStatusCode.BadRequest);
        }

        [Test]
        public async Task should_return_exception()
        {
            var apiException = new VideoApiException<ProblemDetails>("Internal Server Error", (int)HttpStatusCode.InternalServerError,
                "Stacktrace goes here", null, default(ProblemDetails), null);
            _videoApiClientMock
                .Setup(x => x.RaiseVideoEventAsync(It.IsAny<ConferenceEventRequest>()))
                .ThrowsAsync(apiException);

            var result = await _controller.AddMediaEventToConference(Guid.NewGuid(), Builder<AddMediaEventRequest>.CreateNew().Build());
            var typedResult = (ObjectResult)result;
            typedResult.Should().NotBeNull();
        }

        [Test]
        public async Task should_return_no_content_when_self_test_failure_event_is_sent()
        {
            _videoApiClientMock
                .Setup(x => x.RaiseVideoEventAsync(It.IsAny<ConferenceEventRequest>()))
                .Returns(Task.FromResult(default(object)));

            var result = await _controller.AddSelfTestFailureEventToConference(Guid.NewGuid(), 
                Builder<AddSelfTestFailureEventRequest>.CreateNew().Build());
            var typedResult = (NoContentResult)result;
            typedResult.Should().NotBeNull();
        }

        [Test]
        public async Task should_return_bad_request_when_self_test_failure_event_is_sent()
        {
            var apiException = new VideoApiException<ProblemDetails>("Bad Request", (int)HttpStatusCode.BadRequest,
                "Please provide a valid conference Id", null, default(ProblemDetails), null);
            _videoApiClientMock
                .Setup(x => x.RaiseVideoEventAsync(It.IsAny<ConferenceEventRequest>()))
                .ThrowsAsync(apiException);

            var result = await _controller.AddSelfTestFailureEventToConference(Guid.NewGuid(), 
                Builder<AddSelfTestFailureEventRequest>.CreateNew().Build());
            var typedResult = (ObjectResult)result;
            typedResult.StatusCode.Should().Be((int)HttpStatusCode.BadRequest);
        }

        [Test]
        public async Task should_return_exception_when_self_test_failure_event_is_sent()
        {
            var apiException = new VideoApiException<ProblemDetails>("Internal Server Error", (int)HttpStatusCode.InternalServerError,
                "Stacktrace goes here", null, default(ProblemDetails), null);
            _videoApiClientMock
                .Setup(x => x.RaiseVideoEventAsync(It.IsAny<ConferenceEventRequest>()))
                .ThrowsAsync(apiException);

            var result = await _controller.AddSelfTestFailureEventToConference(Guid.NewGuid(), 
                Builder<AddSelfTestFailureEventRequest>.CreateNew().Build());
            var typedResult = (ObjectResult)result;
            typedResult.Should().NotBeNull();
        }
    }
}