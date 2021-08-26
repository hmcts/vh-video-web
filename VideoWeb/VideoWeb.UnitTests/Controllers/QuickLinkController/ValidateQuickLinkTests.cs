using System;
using System.Threading.Tasks;
using Autofac.Extras.Moq;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using VideoApi.Client;
using VideoWeb.Controllers;

namespace VideoWeb.UnitTests.Controllers.QuickLinkController
{
    public class ValidateQuickLinkTests
    {
        private Guid _hearingId;

        private QuickLinksController _controller;
        private AutoMock _mocker;

        [SetUp]
        public void SetUp()
        {
            _mocker = AutoMock.GetLoose();
            _controller = _mocker.Create<QuickLinksController>();
            
            _hearingId = Guid.NewGuid();
            _mocker.Mock<IVideoApiClient>().Setup(x => x.ValidateQuickLinkAsync(_hearingId))
                .ReturnsAsync(true);

            _controller = _mocker.Create<QuickLinksController>();
        }

        [Test]
        public async Task Should_call_video_api_to_validate_quick_link()
        {
            //Arrange/Act
            await _controller.ValidateQuickLink(_hearingId);

            //Assert
            _mocker.Mock<IVideoApiClient>().Verify(x => x.ValidateQuickLinkAsync(_hearingId), Times.Once);
        }

        [Test]
        public async Task Should_return_ok_result_if_video_api_call_returns_successful()
        {
            //Arrange/Act
            var result = await _controller.ValidateQuickLink(_hearingId) as OkObjectResult;

            //Assert
            Assert.IsInstanceOf<OkObjectResult>(result);
            Assert.True((bool)result.Value);
        }

        [Test]
        public async Task Should_return_error_status_code_if_video_api_call_fails()
        {
            //Arrange
            var exception = new VideoApiException("", 500, "response", null, null);
            _mocker.Mock<IVideoApiClient>().Setup(x => x.ValidateQuickLinkAsync(_hearingId))
                .ThrowsAsync(exception);

            //Act
            var result = await _controller.ValidateQuickLink(_hearingId) as ObjectResult;

            //Assert
            Assert.IsInstanceOf<ObjectResult>(result);
            Assert.AreEqual(result.Value, exception.Response);
            Assert.AreEqual(result.StatusCode, exception.StatusCode);
        }
    }
}
