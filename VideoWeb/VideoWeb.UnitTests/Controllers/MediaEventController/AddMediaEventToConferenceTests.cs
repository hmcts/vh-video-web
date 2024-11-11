using System;
using System.Net;
using System.Threading;
using System.Threading.Tasks;
using FizzWare.NBuilder;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Request;
using VideoApi.Client;
using VideoApi.Contract.Requests;
using VideoWeb.Common;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.Controllers.MediaEventController
{
    public class AddMediaEventToConferenceTests
    {
        private VideoWeb.Controllers.MediaEventController _controller;
        private Mock<IVideoApiClient> _videoApiClientMock;
        private Mock<IConferenceService> _conferenceServiceMock;
        private Mock<ILogger<VideoWeb.Controllers.MediaEventController>> _logger;
        private Conference _testConference;

        [SetUp]
        public void Setup()
        {
            _testConference = EventComponentHelper.BuildConferenceForTest();
            _testConference.Participants[0].Username = ClaimsPrincipalBuilder.Username;
            
            _conferenceServiceMock = new Mock<IConferenceService>();
            _videoApiClientMock = new Mock<IVideoApiClient>();
            _logger = new Mock<ILogger<VideoWeb.Controllers.MediaEventController>>();
            var claimsPrincipal = new ClaimsPrincipalBuilder().Build();
            var context = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = claimsPrincipal
                }
            };

            _controller =
                new VideoWeb.Controllers.MediaEventController(_videoApiClientMock.Object, _logger.Object, _conferenceServiceMock.Object)
                {
                    ControllerContext = context
                };
            
            _conferenceServiceMock
                .Setup(x => x.GetConference(_testConference.Id, It.IsAny<CancellationToken>()))
                .ReturnsAsync(_testConference);
        }

        [Test]
        public async Task Should_return_no_content_when_event_is_sent()
        {
            _videoApiClientMock
                .Setup(x => x.RaiseVideoEventAsync(It.IsAny<ConferenceEventRequest>()))
                .Returns(Task.FromResult(default(object)));

            var conferenceId = _testConference.Id;
            var addMediaEventRequest = Builder<AddMediaEventRequest>.CreateNew().Build();
            var result = await _controller.AddMediaEventToConferenceAsync(conferenceId, addMediaEventRequest);

            var typedResult = (NoContentResult) result;
            typedResult.Should().NotBeNull();
            _videoApiClientMock.Verify(v =>
                v.RaiseVideoEventAsync( It.Is<ConferenceEventRequest>(
                    c =>
                    c.ConferenceId == conferenceId.ToString() &&
                    c.ParticipantId == _testConference.Participants[0].Id.ToString() &&
                    c.EventId  != string.Empty &&
                    c.EventType == addMediaEventRequest.EventType &&
                    c.TimeStampUtc != DateTime.MinValue &&
                    c.Reason == "media permission denied"
                )),Times.Once);
        }

        [Test]
        public async Task Should_return_bad_request()
        {
            var apiException = new VideoApiException<ProblemDetails>("Bad Request", (int)HttpStatusCode.BadRequest,
                "Please provide a valid conference Id", null, default, null);
            _videoApiClientMock
                .Setup(x => x.RaiseVideoEventAsync(It.IsAny<ConferenceEventRequest>()))
                .ThrowsAsync(apiException);

            var result = await _controller.AddMediaEventToConferenceAsync(_testConference.Id, Builder<AddMediaEventRequest>.CreateNew().Build());
            var typedResult = (ObjectResult)result;
            typedResult.StatusCode.Should().Be((int)HttpStatusCode.BadRequest);
        }

        [Test]
        public async Task Should_return_exception()
        {
            var apiException = new VideoApiException<ProblemDetails>("Internal Server Error", (int)HttpStatusCode.InternalServerError,
                "Stacktrace goes here", null, default, null);
            _videoApiClientMock
                .Setup(x => x.RaiseVideoEventAsync(It.IsAny<ConferenceEventRequest>()))
                .ThrowsAsync(apiException);

            var result = await _controller.AddMediaEventToConferenceAsync(_testConference.Id, Builder<AddMediaEventRequest>.CreateNew().Build());
            var typedResult = (ObjectResult)result;
            typedResult.Should().NotBeNull();
        }

        [Test]
        public async Task Should_return_no_content_when_self_test_failure_event_is_sent()
        {
            _videoApiClientMock
                .Setup(x => x.RaiseVideoEventAsync(It.IsAny<ConferenceEventRequest>()))
                .Returns(Task.FromResult(default(object)));

            var result = await _controller.AddSelfTestFailureEventToConferenceAsync(_testConference.Id, 
                Builder<AddSelfTestFailureEventRequest>.CreateNew().Build());
            var typedResult = (NoContentResult)result;
            typedResult.Should().NotBeNull();
            _videoApiClientMock.Verify(v => 
                                        v.RaiseVideoEventAsync(It.Is<ConferenceEventRequest>(c => c.Reason.Contains("Failed self-test (Camera)"))),
                                        Times.Once);
        }

        [Test]
        public async Task Should_return_bad_request_when_self_test_failure_event_is_sent()
        {
            var apiException = new VideoApiException<ProblemDetails>("Bad Request", (int)HttpStatusCode.BadRequest,
                "Please provide a valid conference Id", null, default, null);
            _videoApiClientMock
                .Setup(x => x.RaiseVideoEventAsync(It.IsAny<ConferenceEventRequest>()))
                .ThrowsAsync(apiException);

            var result = await _controller.AddSelfTestFailureEventToConferenceAsync(_testConference.Id, 
                Builder<AddSelfTestFailureEventRequest>.CreateNew().Build());
            var typedResult = (ObjectResult)result;
            typedResult.StatusCode.Should().Be((int)HttpStatusCode.BadRequest);
        }

        [Test]
        public async Task Should_return_exception_when_self_test_failure_event_is_sent()
        {
            var apiException = new VideoApiException<ProblemDetails>("Internal Server Error", (int)HttpStatusCode.InternalServerError,
                "Stacktrace goes here", null, default, null);
            _videoApiClientMock
                .Setup(x => x.RaiseVideoEventAsync(It.IsAny<ConferenceEventRequest>()))
                .ThrowsAsync(apiException);

            var result = await _controller.AddSelfTestFailureEventToConferenceAsync(_testConference.Id, 
                Builder<AddSelfTestFailureEventRequest>.CreateNew().Build());
            var typedResult = (ObjectResult)result;
            typedResult.Should().NotBeNull();
        }
    }
}
