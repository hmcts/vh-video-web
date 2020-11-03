using System;
using System.Net;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using VideoWeb.Contract.Request;
using VideoWeb.Services.Video;
using ProblemDetails = VideoWeb.Services.Video.ProblemDetails;

namespace VideoWeb.UnitTests.Controllers.InternalEventController
{
    public class AddSelfTestFailureEventToConferenceTests : MediaEventBaseTestSetup
    {

        [SetUp]
        public void Setup()
        {
            InitSetup();
        }

        [Test]
        public async Task Should_return_no_content_when_event_is_sent()
        {
            VideoApiClientMock
                .Setup(x => x.RaiseVideoEventAsync(It.IsAny<ConferenceEventRequest>()))
                .Returns(Task.FromResult(default(object)));

            var conferenceId = TestConference.Id;
            var request = new AddSelfTestFailureEventRequest
            {
                SelfTestFailureReason = SelfTestFailureReason.BadScore
            };
            var result = await Controller.AddSelfTestFailureEventToConferenceAsync(conferenceId, request);
            var typedResult = (NoContentResult) result;
            typedResult.Should().NotBeNull();
        }

        [Test]
        public async Task Should_return_status_code_with_message_when_not_successful()
        {
            var apiException = new VideoApiException<ProblemDetails>("Internal Server Error",
                (int) HttpStatusCode.InternalServerError,
                "Stacktrace goes here", null, default, null);
            VideoApiClientMock
                .Setup(x => x.RaiseVideoEventAsync(It.IsAny<ConferenceEventRequest>()))
                .ThrowsAsync(apiException);

            var conferenceId = TestConference.Id;
            var request = new AddSelfTestFailureEventRequest
            {
                SelfTestFailureReason = SelfTestFailureReason.BadScore
            };
            var result = await Controller.AddSelfTestFailureEventToConferenceAsync(conferenceId, request);
            var typedResult = (ObjectResult) result;
            typedResult.Should().NotBeNull();
        }
        
        [Test]
        public async Task Should_call_api_when_cache_is_empty()
        {
            ConferenceCacheMock.Setup(cache => cache.GetOrAddConferenceAsync(TestConference.Id, It.IsAny<Func<Task<ConferenceDetailsResponse>>>()))
                .Callback(async (Guid anyGuid, Func<Task<ConferenceDetailsResponse>> factory) => await factory())
                .ReturnsAsync(TestConference);
            VideoApiClientMock
                .Setup(x => x.RaiseVideoEventAsync(It.IsAny<ConferenceEventRequest>()))
                .Returns(Task.FromResult(default(object)));
            
            var conferenceId = TestConference.Id;
            var request = new AddSelfTestFailureEventRequest
            {
                SelfTestFailureReason = SelfTestFailureReason.BadScore
            };
            await Controller.AddSelfTestFailureEventToConferenceAsync(conferenceId, request);
            VideoApiClientMock.Verify(x => x.GetConferenceDetailsByIdAsync(TestConference.Id), Times.Once);
        }
    }
}
