using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Autofac.Extras.Moq;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Request;
using VideoWeb.Controllers;
using VideoWeb.EventHub.Services;

namespace VideoWeb.UnitTests.Controllers.ConferenceManagement;

public class SetVideoControlStatusesForConferenceTests
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
    public async Task should_update_the_statuses_for_the_conference_and_return_accepted()
    {
        // Arrange
        var conferenceId = Guid.NewGuid();
        var conferenceVideoControlStatusesRequest = new SetConferenceVideoControlStatusesRequest()
        {
            ParticipantIdToVideoControlStatusMap = new Dictionary<string, SetConferenceVideoControlStatusesRequest.VideoControlStatusRequest>()
        };
        
        // Act
        var response = await _sut.SetVideoControlStatusesForConference(conferenceId, conferenceVideoControlStatusesRequest);
        
        // Assert
        _mocker.Mock<IConferenceVideoControlStatusService>().Verify(x => x.SetVideoControlStateForConference(conferenceId, It.IsAny<ConferenceVideoControlStatuses>()), Times.Once);
        response.Should().BeAssignableTo<AcceptedResult>();
    }
    
    [Test]
    public async Task should_update_the_statuses_for_the_conference_and_return_accepted_when_parameter_is_null()
    {
        // Arrange
        var conferenceId = Guid.NewGuid();
        
        // Act
        var response = await _sut.SetVideoControlStatusesForConference(conferenceId, null);
        
        // Assert
        _mocker.Mock<IConferenceVideoControlStatusService>().Verify(x => x.SetVideoControlStateForConference(conferenceId, null), Times.Once);
        response.Should().BeAssignableTo<AcceptedResult>();
    }
    
    [Test]
    public void SetVideoControlStatusesForConference_When_Exception_is_thrown_by_SetVideoControlStateForConference()
    {
        // Arrange
        var conferenceId = Guid.NewGuid();
        
        _mocker.Mock<IConferenceVideoControlStatusService>().Setup(x => x.SetVideoControlStateForConference(It.IsAny<Guid>(), It.IsAny<ConferenceVideoControlStatuses>())).Throws<Exception>();
        
        // Act
        Assert.ThrowsAsync<Exception>(async () => await _sut.SetVideoControlStatusesForConference(conferenceId, null));
    }
}
