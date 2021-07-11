using FizzWare.NBuilder;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;
using VideoApi.Client;
using VideoApi.Contract.Enums;
using VideoApi.Contract.Responses;
using VideoWeb.Controllers;

namespace VideoWeb.UnitTests.Controllers.MagicLinkController
{
    public class ValidateMagicLinkTests
    {
        private ConferenceDetailsResponse _conference;
        private Guid _hearingId;

        private MagicLinksController _controller;
        private Mock<IVideoApiClient> _videoApiClientMock;
        private Mock<ILogger<MagicLinksController>> _mockLogger;

        [SetUp]
        public void SetUp()
        {
            _videoApiClientMock = new Mock<IVideoApiClient>();

            _hearingId = Guid.NewGuid();
            _conference = Builder<ConferenceDetailsResponse>.CreateNew()
                .With(x => x.HearingId = _hearingId)
                .With(x => x.CurrentStatus = ConferenceState.NotStarted)
                .Build();
            _videoApiClientMock.Setup(x => x.GetConferenceByHearingRefIdAsync(_hearingId, It.IsAny<bool>()))
                .ReturnsAsync(_conference);

            _mockLogger = new Mock<ILogger<MagicLinksController>>();
            _controller = new MagicLinksController(_videoApiClientMock.Object, _mockLogger.Object);
        }

        [Test]
        public async Task Should_call_video_api_to_retrieve_conference()
        {
            //Arrange/Act
            await _controller.ValidateMagicLink(_hearingId);

            //Assert
            _videoApiClientMock.Verify(x => x.GetConferenceByHearingRefIdAsync(_hearingId, true), Times.Once);
        }

        [Test]
        public async Task Should_return_false_ok_result_if_hearing_does_not_exist()
        {
            //Arrange
            _conference = null;
            _videoApiClientMock.Setup(x => x.GetConferenceByHearingRefIdAsync(_hearingId, It.IsAny<bool>()))
                .ReturnsAsync(_conference);

            //Act
            var result = await _controller.ValidateMagicLink(_hearingId) as OkObjectResult;

            //Assert
            Assert.IsInstanceOf<OkObjectResult>(result);
            Assert.False((bool)result.Value);
        }

        [Test]
        public async Task Should_return_false_ok_result_if_hearing_is_closed()
        {
            //Arrange
            _conference.CurrentStatus = ConferenceState.Closed;
            _videoApiClientMock.Setup(x => x.GetConferenceByHearingRefIdAsync(_hearingId, It.IsAny<bool>()))
                .ReturnsAsync(_conference);

            //Act
            var result = await _controller.ValidateMagicLink(_hearingId) as OkObjectResult;

            //Assert
            Assert.IsInstanceOf<OkObjectResult>(result);
            Assert.False((bool)result.Value);
        }

        [Test]
        public async Task Should_return_true_ok_result()
        {
            //Arrange/Act
            var result = await _controller.ValidateMagicLink(_hearingId) as OkObjectResult;

            //Assert
            Assert.IsInstanceOf<OkObjectResult>(result);
            Assert.True((bool)result.Value);
        }
    }
}
