using System.Net;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using VideoWeb.Contract.Request;
using VideoWeb.Services.Video;

namespace VideoWeb.UnitTests.Controllers.InternalEventController
{
    public class ConnectingToConferenceTests : MediaEventBaseTestSetup
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
            var request = new ConnectingToConference();
            var result = await Controller.AddConnectingToConferenceAsync(conferenceId, request);
            var typedResult = (NoContentResult)result;

            typedResult.Should().NotBeNull();
        }

        [Test]
        public async Task Should_return_status_code_with_message_when_not_successful()
        {
            var apiException = new VideoApiException<Microsoft.AspNetCore.Mvc.ProblemDetails>("Internal Server Error",
                (int)HttpStatusCode.InternalServerError,
                "Stacktrace goes here", null, default, null);
            VideoApiClientMock
                .Setup(x => x.RaiseVideoEventAsync(It.IsAny<ConferenceEventRequest>()))
                .ThrowsAsync(apiException);

            var conferenceId = TestConference.Id;
            var request = new ConnectingToConference();
            var result = await Controller.AddConnectingToConferenceAsync(conferenceId, request);
            var typedResult = (ObjectResult)result;

            typedResult.Should().NotBeNull();
        }
    }
}
