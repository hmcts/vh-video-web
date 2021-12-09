﻿using System;
using System.Threading.Tasks;
using Autofac.Extras.Moq;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using VideoApi.Client;
using VideoApi.Contract.Requests;
using VideoWeb.Common.Models;
using VideoWeb.Controllers;
using VideoWeb.EventHub.Services;

namespace VideoWeb.UnitTests.Controllers.ConferenceManagement
{
    public class GetVideoControlStatusesForConferenceTests
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
            response.Should().BeAssignableTo<NotFoundResult>();
        }
    }
}
