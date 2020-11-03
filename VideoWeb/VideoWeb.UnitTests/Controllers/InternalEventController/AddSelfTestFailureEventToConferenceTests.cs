using System;
using System.Net;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Request;
using VideoWeb.Services.Video;
using ProblemDetails = VideoWeb.Services.Video.ProblemDetails;

namespace VideoWeb.UnitTests.Controllers.MediaEventController
{
    public class AddSelfTestFailureEventToConferenceTests : MediaEventBaseTestSetup
    {
        private VideoWeb.Controllers.InternalEventController _controller;
        private Mock<IVideoApiClient> _videoApiClientMock;
        private Mock<IConferenceCache> _conferenceCacheMock;
        private Conference _testConference;

        [SetUp]
        public void Setup()
        {
            InitSetup();
        }

        [Test]
        public async Task Should_return_no_content_when_event_is_sent()
        {
            _videoApiClientMock
                .Setup(x => x.RaiseVideoEventAsync(It.IsAny<ConferenceEventRequest>()))
                .Returns(Task.FromResult(default(object)));

            var conferenceId = _testConference.Id;
            var request = new AddSelfTestFailureEventRequest
            {
                SelfTestFailureReason = SelfTestFailureReason.BadScore
            };
            var result = await _controller.AddSelfTestFailureEventToConferenceAsync(conferenceId, request);
            var typedResult = (NoContentResult) result;
            typedResult.Should().NotBeNull();
        }

        [Test]
        public async Task Should_return_status_code_with_message_when_not_successful()
        {
            var apiException = new VideoApiException<ProblemDetails>("Internal Server Error",
                (int) HttpStatusCode.InternalServerError,
                "Stacktrace goes here", null, default, null);
            _videoApiClientMock
                .Setup(x => x.RaiseVideoEventAsync(It.IsAny<ConferenceEventRequest>()))
                .ThrowsAsync(apiException);

            var conferenceId = _testConference.Id;
            var request = new AddSelfTestFailureEventRequest
            {
                SelfTestFailureReason = SelfTestFailureReason.BadScore
            };
            var result = await _controller.AddSelfTestFailureEventToConferenceAsync(conferenceId, request);
            var typedResult = (ObjectResult) result;
            typedResult.Should().NotBeNull();
        }
        
        [Test]
        public async Task Should_call_api_when_cache_is_empty()
        {
            _conferenceCacheMock.Setup(cache => cache.GetOrAddConferenceAsync(_testConference.Id, It.IsAny<Func<Task<ConferenceDetailsResponse>>>()))
                .Callback(async (Guid anyGuid, Func<Task<ConferenceDetailsResponse>> factory) => await factory())
                .ReturnsAsync(_testConference);
            _videoApiClientMock
                .Setup(x => x.RaiseVideoEventAsync(It.IsAny<ConferenceEventRequest>()))
                .Returns(Task.FromResult(default(object)));
            
            var conferenceId = _testConference.Id;
            var request = new AddSelfTestFailureEventRequest
            {
                SelfTestFailureReason = SelfTestFailureReason.BadScore
            };
            await _controller.AddSelfTestFailureEventToConferenceAsync(conferenceId, request);
            _videoApiClientMock.Verify(x => x.GetConferenceDetailsByIdAsync(_testConference.Id), Times.Once);
        }
    }
}
