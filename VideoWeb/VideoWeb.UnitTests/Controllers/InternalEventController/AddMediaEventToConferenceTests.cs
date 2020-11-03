using System;
using System.Net;
using System.Threading.Tasks;
using FizzWare.NBuilder;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using VideoWeb.Contract.Request;
using VideoWeb.Services.Video;
using ProblemDetails = VideoWeb.Services.Video.ProblemDetails;

namespace VideoWeb.UnitTests.Controllers.InternalEventController
{
    public class AddMediaEventToConferenceTests : MediaEventBaseTestSetup
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
            var addMediaEventRequest = Builder<AddMediaEventRequest>.CreateNew().Build();
            var result = await Controller.AddMediaEventToConferenceAsync(conferenceId, addMediaEventRequest);

            var typedResult = (NoContentResult) result;
            typedResult.Should().NotBeNull();
            VideoApiClientMock.Verify(v =>
                v.RaiseVideoEventAsync( It.Is<ConferenceEventRequest>(
                    c =>
                    c.Conference_id == conferenceId.ToString() &&
                    c.Participant_id == TestConference.Participants[0].Id.ToString() &&
                    c.Event_id  != string.Empty &&
                    c.Event_type == addMediaEventRequest.EventType &&
                    c.Time_stamp_utc != DateTime.MinValue &&
                    c.Reason == "media permission denied"
                )),Times.Once);
        }

        [Test]
        public async Task Should_return_bad_request()
        {
            var apiException = new VideoApiException<ProblemDetails>("Bad Request", (int)HttpStatusCode.BadRequest,
                "Please provide a valid conference Id", null, default, null);
            VideoApiClientMock
                .Setup(x => x.RaiseVideoEventAsync(It.IsAny<ConferenceEventRequest>()))
                .ThrowsAsync(apiException);

            var result = await Controller.AddMediaEventToConferenceAsync(TestConference.Id, Builder<AddMediaEventRequest>.CreateNew().Build());
            var typedResult = (ObjectResult)result;
            typedResult.StatusCode.Should().Be((int)HttpStatusCode.BadRequest);
        }

        [Test]
        public async Task Should_return_exception()
        {
            var apiException = new VideoApiException<ProblemDetails>("Internal Server Error", (int)HttpStatusCode.InternalServerError,
                "Stacktrace goes here", null, default, null);
            VideoApiClientMock
                .Setup(x => x.RaiseVideoEventAsync(It.IsAny<ConferenceEventRequest>()))
                .ThrowsAsync(apiException);

            var result = await Controller.AddMediaEventToConferenceAsync(TestConference.Id, Builder<AddMediaEventRequest>.CreateNew().Build());
            var typedResult = (ObjectResult)result;
            typedResult.Should().NotBeNull();
        }

        [Test]
        public async Task Should_return_no_content_when_self_test_failure_event_is_sent()
        {
            VideoApiClientMock
                .Setup(x => x.RaiseVideoEventAsync(It.IsAny<ConferenceEventRequest>()))
                .Returns(Task.FromResult(default(object)));

            var result = await Controller.AddSelfTestFailureEventToConferenceAsync(TestConference.Id, 
                Builder<AddSelfTestFailureEventRequest>.CreateNew().Build());
            var typedResult = (NoContentResult)result;
            typedResult.Should().NotBeNull();
            VideoApiClientMock.Verify(v => 
                                        v.RaiseVideoEventAsync(It.Is<ConferenceEventRequest>(c => c.Reason.Contains("Failed self-test (Camera)"))),
                                        Times.Once);
        }

        [Test]
        public async Task Should_return_bad_request_when_self_test_failure_event_is_sent()
        {
            var apiException = new VideoApiException<ProblemDetails>("Bad Request", (int)HttpStatusCode.BadRequest,
                "Please provide a valid conference Id", null, default, null);
            VideoApiClientMock
                .Setup(x => x.RaiseVideoEventAsync(It.IsAny<ConferenceEventRequest>()))
                .ThrowsAsync(apiException);

            var result = await Controller.AddSelfTestFailureEventToConferenceAsync(TestConference.Id, 
                Builder<AddSelfTestFailureEventRequest>.CreateNew().Build());
            var typedResult = (ObjectResult)result;
            typedResult.StatusCode.Should().Be((int)HttpStatusCode.BadRequest);
        }

        [Test]
        public async Task Should_return_exception_when_self_test_failure_event_is_sent()
        {
            var apiException = new VideoApiException<ProblemDetails>("Internal Server Error", (int)HttpStatusCode.InternalServerError,
                "Stacktrace goes here", null, default, null);
            VideoApiClientMock
                .Setup(x => x.RaiseVideoEventAsync(It.IsAny<ConferenceEventRequest>()))
                .ThrowsAsync(apiException);

            var result = await Controller.AddSelfTestFailureEventToConferenceAsync(TestConference.Id, 
                Builder<AddSelfTestFailureEventRequest>.CreateNew().Build());
            var typedResult = (ObjectResult)result;
            typedResult.Should().NotBeNull();
        }
    }
}
