using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Autofac.Extras.Moq;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using VideoApi.Client;
using VideoApi.Contract.Requests;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Request;
using VideoWeb.Controllers;
using VideoWeb.EventHub.Services;

namespace VideoWeb.UnitTests.Controllers.ConferenceManagement
{
    public class SetVideoControlStatusesForConferenceTests
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
        public async Task should_update_the_statuses_for_the_conference_and_return_accepted()
        {
            // Arrange
            var conferenceId = Guid.NewGuid();
            var map = new Dictionary<Guid, VideoControlStatus>();
            var conferenceVideoControlStatusesRequest = new SetConferenceVideoControlStatusesRequest()
            {
                ParticipantIdToVideoControlStatusMap = map
            };

            // Act
            var response = await _sut.SetVideoControlStatusesForConference(conferenceId, conferenceVideoControlStatusesRequest);

            // Assert
            _mocker.Mock<IConferenceVideoControlStatusService>().Verify(x => x.SetVideoControlStateForConference(conferenceId, It.Is<ConferenceVideoControlStatuses>(y => y.ParticipantIdToVideoControlStatusMap == map)), Times.Once);
            response.Should().BeAssignableTo<AcceptedResult>();
        }

        [Test]
        public async Task should_update_the_statuses_for_the_conference_and_return_accepted_when_parameter_is_null()
        {
            // Arrange
            var conferenceId = Guid.NewGuid();
            var map = new Dictionary<Guid, VideoControlStatus>();

            // Act
            var response = await _sut.SetVideoControlStatusesForConference(conferenceId, null);

            // Assert
            _mocker.Mock<IConferenceVideoControlStatusService>().Verify(x => x.SetVideoControlStateForConference(conferenceId, null), Times.Once);
            response.Should().BeAssignableTo<AcceptedResult>();
        }
    }
}
