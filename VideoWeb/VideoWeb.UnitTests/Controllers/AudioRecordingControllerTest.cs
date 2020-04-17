using System;
using System.Collections.Generic;
using System.Net;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using VideoWeb.Contract.Responses;
using VideoWeb.Controllers;
using VideoWeb.Services.Bookings;
using VideoWeb.Services.Video;

namespace VideoWeb.UnitTests.Controllers
{
    public class AudioRecordingControllerTest
    {
        private AudioRecordingController _controller;
        private Mock<IVideoApiClient> _videoApiClientMock;
        private Mock<ILogger<VenuesController>> _mockLogger;

        [SetUp]
        public void Setup()
        {
            _videoApiClientMock = new Mock<IVideoApiClient>();
            _mockLogger = new Mock<ILogger<VenuesController>>();
            _controller = new AudioRecordingController(_videoApiClientMock.Object, _mockLogger.Object);
        }

        [Test]
        public async Task Should_return_success_true_of_stopping_audio_recording_with_status_ok()
        {
            var audioRecordingStopResponse = new AudioRecordingStopResponse { Success = true};

          //  _videoApiClientMock.Setup(x => x.stopAudioREcordingAsync()).ReturnsAsync(audioRecordingStopResponse);
            var result = await _controller.StopAudioRecordingAsync("case number1",Guid.NewGuid());
            var typedResult = (OkObjectResult)result.Result;
            typedResult.Should().NotBeNull();
            var response = typedResult.Value;
            response.Should().NotBeNull();
        }
    }
}
