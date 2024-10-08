using Autofac.Extras.Moq;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using System;
using System.Net;
using System.Threading;
using System.Threading.Tasks;
using VideoApi.Client;
using VideoApi.Contract.Requests;
using VideoWeb.Controllers;
using VideoWeb.EventHub.Services;

namespace VideoWeb.UnitTests.Controllers.ConferenceManagement
{
    [TestFixture]
    class GetLayoutForHearingTests
    {
        private AutoMock _mocker;
        private ConferenceManagementController _sut;

        [SetUp]
        public void SetUp()
        {
            _mocker = AutoMock.GetLoose();
            _sut = _mocker.Create<ConferenceManagementController>();
        }

        [Test]
        public async Task should_return_the_layout_for_the_hearing()
        {
            // Arrange
            var conferenceId = Guid.NewGuid();
            var expectedLayout = HearingLayout.TwoPlus21;

            _mocker.Mock<IHearingLayoutService>()
                .Setup(x => x.GetCurrentLayout(It.Is<Guid>(guid => guid == conferenceId),
                    It.IsAny<CancellationToken>())).ReturnsAsync(expectedLayout);

            // Act
            var layoutResponse = await _sut.GetLayoutForHearing(conferenceId, CancellationToken.None);

            // Assert
            layoutResponse.Should().BeAssignableTo<OkObjectResult>().Which.Value.Should().Be(expectedLayout);
        }

        [Test]
        public async Task should_return_a_404_if_the_layout_returned_is_null()
        {
            // Arrange
            var conferenceId = Guid.NewGuid();

            _mocker.Mock<IHearingLayoutService>()
                .Setup(x => x.GetCurrentLayout(It.Is<Guid>(x => x == conferenceId), It.IsAny<CancellationToken>()))
                .Returns(Task.FromResult<HearingLayout?>(null));

            // Act
            var layoutResponse = await _sut.GetLayoutForHearing(conferenceId, CancellationToken.None);

            // Assert
            layoutResponse.Should().BeAssignableTo<NotFoundResult>();
        }
        
        [Test]
        public async Task GetLayoutForHearing_handles_when_GetCurrentLayoutThrows_VideoApiException()
        {
            // Arrange
            var conferenceId = Guid.NewGuid();

            var exception = new VideoApiException("message", 404, null, null, null);
            _mocker.Mock<IHearingLayoutService>()
                .Setup(x => x.GetCurrentLayout(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
                .Throws(exception);

            // Act
            var result = await _sut.GetLayoutForHearing(conferenceId, CancellationToken.None) as ObjectResult;

            // Assert
            result.StatusCode.Should().Be((int)HttpStatusCode.NotFound);
        }
        
        [Test]
        public void GetLayoutForHearing_handles_when_GetCurrentLayoutThrows_Exception()
        {
            // Arrange
            var conferenceId = Guid.NewGuid();

            _mocker.Mock<IHearingLayoutService>()
                .Setup(x => x.GetCurrentLayout(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
                .Throws<Exception>();

            // Act
            Assert.ThrowsAsync<InvalidOperationException>(async () => await _sut.GetLayoutForHearing(conferenceId, CancellationToken.None));
        }
    }
}
