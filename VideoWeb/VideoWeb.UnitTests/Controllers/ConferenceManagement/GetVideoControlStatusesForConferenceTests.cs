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
            var conferenceId = Guid.NewGuid();
            var conferenceVideoControlStatuses = new ConferenceVideoControlStatuses();
                
            _mocker.Mock<IConferenceVideoControlStatusService>().Setup(x => x.GetVideoControlStateForConference(It.Is<Guid>(y => y == conferenceId))).ReturnsAsync(conferenceVideoControlStatuses);

            // Act
            var response = await _sut.GetVideoControlStatusesForConference(conferenceId);

            // Assert
            response.Should().BeAssignableTo<OkObjectResult>().Which.Value.Should().Be(conferenceVideoControlStatuses);
        }

        [Test]
        public async Task should_return_a_404_if_the_statues_returned_is_null()
        {
            // Arrange
            var conferenceId = Guid.NewGuid();

            _mocker.Mock<IConferenceVideoControlStatusService>().Setup(x => x.GetVideoControlStateForConference(It.Is<Guid>(y => y == conferenceId))).ReturnsAsync((ConferenceVideoControlStatuses?)null);

            // Act
            var response = await _sut.GetVideoControlStatusesForConference(conferenceId);
            
            // Assert
            response.Should().BeAssignableTo<NotFoundObjectResult>();
        }

        [Test]
        public async Task GetVideoControlStatusesForConference_when_GetVideoControlStateForConference_throw_Exception()
        {
            // Arrange
            var conferenceId = Guid.NewGuid();

            _mocker.Mock<IConferenceVideoControlStatusService>()
                .Setup(x => x.GetVideoControlStateForConference(It.Is<Guid>(y => y == conferenceId)))
                .Throws<Exception>();

            // Act
            var result = await _sut.GetVideoControlStatusesForConference(conferenceId) as StatusCodeResult;

            // Assert
            result.StatusCode.Should().Be((int)HttpStatusCode.InternalServerError);
        }
    }
}
