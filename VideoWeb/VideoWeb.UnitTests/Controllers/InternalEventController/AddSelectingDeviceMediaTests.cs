using System;
using System.Net;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Request;
using VideoWeb.Services.Video;

namespace VideoWeb.UnitTests.Controllers.MediaEventController
{
    public class AddSelectingDeviceMediaTests : MediaEventBaseTestSetup
    {
        private VideoWeb.Controllers.InternalEventController _controller;
        private Mock<IVideoApiClient> _videoApiClientMock;
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
            var request = CreateDeviceMedia();
            var result = await _controller.AddSelectingDeviceMediaAsync(conferenceId, request);
            var typedResult = (NoContentResult)result;

            typedResult.Should().NotBeNull();
        }

        [Test]
        public async Task Should_return_status_code_with_message_when_not_successful()
        {
            var apiException = new VideoApiException<Microsoft.AspNetCore.Mvc.ProblemDetails>("Internal Server Error",
                (int)HttpStatusCode.InternalServerError,
                "Stacktrace goes here", null, default, null);
            _videoApiClientMock
                .Setup(x => x.RaiseVideoEventAsync(It.IsAny<ConferenceEventRequest>()))
                .ThrowsAsync(apiException);

            var conferenceId = _testConference.Id;
            var request = CreateDeviceMedia();
            var result = await _controller.AddSelectingDeviceMediaAsync(conferenceId, request);
            var typedResult = (ObjectResult)result;

            typedResult.Should().NotBeNull();
        }

        private SelectingDeviceMedia CreateDeviceMedia()
        {
            return new SelectingDeviceMedia
            {
                Camera = "Camera",
                Mic = "Mic"
            };
        }
    }
}
