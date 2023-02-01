using System;
using System.Net;
using System.Threading.Tasks;
using Autofac.Extras.Moq;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using VideoWeb.Common.Models;
using VideoWeb.Controllers;
using VideoWeb.EventHub.Services;

namespace VideoWeb.UnitTests.Controllers.ConferenceManagement
{
    public class GetVideoControlStatusesForConferenceTests
    {
        private AutoMock _mocker;
        private ConferenceStatusController _sut;

        private Guid _conferenceId = Guid.NewGuid();

        [SetUp]
        public void SetUp()
        {
            _mocker = AutoMock.GetLoose();
            _sut = _mocker.Create<ConferenceStatusController>();
        }

        [Test]
        public async Task should_return_the_statuses_for_the_conference()
        {
            // Arrange
            var conferenceVideoControlStatuses = new ConferenceVideoControlStatuses();
                
            _mocker.Mock<IConferenceVideoControlStatusService>().Setup(x => x.GetVideoControlStateForConference(It.Is<Guid>(y => y == _conferenceId))).ReturnsAsync(conferenceVideoControlStatuses);

            // Act
            var response = await _sut.GetVideoControlStatusesForConference(_conferenceId);

            // Assert
            response.Should().BeAssignableTo<OkObjectResult>().Which.Value.Should().Be(conferenceVideoControlStatuses);
        }

        [Test]
        public async Task should_return_NoContent_status_code_if_video_control_statuses_is_null()
        {

            _mocker.Mock<IConferenceVideoControlStatusService>()
                .Setup(x => x.GetVideoControlStateForConference(It.IsAny<Guid>()))
                .ReturnsAsync(() => default);

            var response = await _sut.GetVideoControlStatusesForConference(_conferenceId) as NoContentResult;

            Assert.AreEqual(response.StatusCode, (int)HttpStatusCode.NoContent);
        }

        [Test]
        public async Task GetVideoControlStatusesForConference_when_GetVideoControlStateForConference_throw_Exception()
        {
            // Arrange

            _mocker.Mock<IConferenceVideoControlStatusService>()
                .Setup(x => x.GetVideoControlStateForConference(It.Is<Guid>(y => y == _conferenceId)))
                .Throws<Exception>();

            // Act
            Assert.ThrowsAsync<Exception>(async () => await _sut.GetVideoControlStatusesForConference(_conferenceId));
        }
    }
}
