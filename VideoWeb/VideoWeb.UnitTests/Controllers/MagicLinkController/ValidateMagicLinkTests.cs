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
        private Guid _hearingId;

        private MagicLinksController _controller;
        private Mock<IVideoApiClient> _videoApiClientMock;
        private Mock<ILogger<MagicLinksController>> _mockLogger;

        [SetUp]
        public void SetUp()
        {
            _videoApiClientMock = new Mock<IVideoApiClient>();

            _hearingId = Guid.NewGuid();
            _videoApiClientMock.Setup(x => x.ValidateMagicLinkAsync(_hearingId))
                .ReturnsAsync(true);

            _mockLogger = new Mock<ILogger<MagicLinksController>>();
            _controller = new MagicLinksController(_videoApiClientMock.Object, _mockLogger.Object);
        }

        [Test]
        public async Task Should_call_video_api_to_validate_magic_link()
        {
            //Arrange/Act
            await _controller.ValidateMagicLink(_hearingId);

            //Assert
            _videoApiClientMock.Verify(x => x.ValidateMagicLinkAsync(_hearingId), Times.Once);
        }

        [Test]
        public async Task Should_return_ok_result_if_video_api_call_returns_successful()
        {
            //Arrange/Act
            var result = await _controller.ValidateMagicLink(_hearingId) as OkObjectResult;

            //Assert
            Assert.IsInstanceOf<OkObjectResult>(result);
            Assert.True((bool)result.Value);
        }

        [Test]
        public async Task Should_return_error_status_code_if_video_api_call_fails()
        {
            //Arrange
            var exception = new VideoApiException("", 500, "response", null, null);
            _videoApiClientMock.Setup(x => x.ValidateMagicLinkAsync(_hearingId))
                .ThrowsAsync(exception);

            //Act
            var result = await _controller.ValidateMagicLink(_hearingId) as ObjectResult;

            //Assert
            Assert.IsInstanceOf<ObjectResult>(result);
            Assert.AreEqual(result.Value, exception.Response);
            Assert.AreEqual(result.StatusCode, exception.StatusCode);
        }
    }
}
