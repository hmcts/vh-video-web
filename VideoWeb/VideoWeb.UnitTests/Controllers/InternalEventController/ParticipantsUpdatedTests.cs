using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Autofac.Extras.Moq;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using VideoApi.Contract.Requests;
using VideoWeb.Common;
using VideoWeb.Common.Models;
using VideoWeb.Helpers.Interfaces;
using VideoWeb.Mappings;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.Controllers.InternalEventController;

public class ParticipantsUpdatedTests
{
    private AutoMock _mocker;
    private VideoWeb.Controllers.InternalEventController _controller;
    private Guid _testConferenceId;
    Mock<Conference> _mockConference;
    Guid _removedId =  Guid.NewGuid();
    
    [SetUp]
    public void Setup()
    {
        _mocker = AutoMock.GetLoose();
        var claimsPrincipal = new ClaimsPrincipalBuilder().WithRole("Judge").Build();
        var context = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = claimsPrincipal
            }
        };
        
        _controller = _mocker.Create<VideoWeb.Controllers.InternalEventController>();
        _controller.ControllerContext = context;
        _testConferenceId = Guid.NewGuid();
        _mockConference = _mocker.Mock<Conference>();
        _mockConference.Object.Participants =
        [
            new() { Id = Guid.NewGuid(), Role = Role.Judge }, new() { Id = _removedId, Role = Role.Individual }
        ];
        _mockConference.Object.Id = _testConferenceId;
        
        _mocker.Mock<IConferenceService>()
            .Setup(x => x.GetConference(It.Is<Guid>(id => id == _testConferenceId)))
            .ReturnsAsync(_mockConference.Object);
        
        _mocker.Mock<IParticipantsUpdatedEventNotifier>();
    }
    
    [Test]
    public async Task Should_send_event()
    {
        // Arrange
        var updateParticipantsRequest = new UpdateConferenceParticipantsRequest
        {
            RemovedParticipants = new List<Guid> {_removedId}
        };
        var updateConference = new Conference
        {
            Id = _mockConference.Object.Id,
            HearingId = _mockConference.Object.HearingId,
            Participants = _mockConference.Object.Participants.Where(e => e.Id != _removedId).ToList()
        };
        
        _mocker.Mock<IConferenceService>()
            .Setup(x => x.ForceGetConference(It.Is<Guid>(id => id == _testConferenceId)))
            .ReturnsAsync(updateConference);
        // Act
        var result = await _controller.ParticipantsUpdated(_testConferenceId, updateParticipantsRequest);
        
        // Assert
        result.Should().BeOfType<NoContentResult>();
        
        _mocker.Mock<IConferenceService>().Verify(x
            => x.GetConference(It.IsAny<Guid>()), Times.Once);
        
        _mocker.Mock<IConferenceService>().Verify(x
            => x.ForceGetConference(It.IsAny<Guid>()), Times.Once);
        
        _mocker.Mock<IParticipantsUpdatedEventNotifier>().Verify(x => x.PushParticipantsUpdatedEvent(
            It.IsAny<Conference>(),
            It.Is<List<Participant>>(participants => participants.Any(p => p.Id == _removedId))
        ), Times.Once);
    }
}
