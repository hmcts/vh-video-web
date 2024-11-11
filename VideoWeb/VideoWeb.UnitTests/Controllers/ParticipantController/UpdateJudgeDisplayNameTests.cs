using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using System.Net;
using System.Threading;
using System.Threading.Tasks;
using VideoWeb.Common.Models;
using VideoWeb.Controllers;
using VideoWeb.EventHub.Handlers.Core;
using VideoApi.Client;
using VideoWeb.UnitTests.Builders;
using EventHubEventType = VideoWeb.EventHub.Enums.EventType;
using Autofac.Extras.Moq;
using VideoWeb.Contract.Request;
using VideoApi.Contract.Requests;
using VideoWeb.Common;
using VideoWeb.EventHub.Models;
using VideoWeb.Helpers.Interfaces;

namespace VideoWeb.UnitTests.Controllers.ParticipantController;

public class UpdateJudgeDisplayNameTests
{
    private AutoMock _mocker;
    private ParticipantsController _sut;
    private Conference _testConference;
    
    [SetUp]
    public void Setup()
    {
        _mocker = AutoMock.GetLoose();
        
        var eventHandlerMock = _mocker.Mock<IEventHandler>();
        _mocker.Mock<IEventHandlerFactory>().Setup(x => x.Get(It.IsAny<EventHubEventType>())).Returns(eventHandlerMock.Object);
        
        var claimsPrincipal = new ClaimsPrincipalBuilder().Build();
        
        var eventComponentHelper = new EventComponentHelper();
        _testConference = EventComponentHelper.BuildConferenceForTest();
        _testConference.Participants[0].Username = ClaimsPrincipalBuilder.Username;
        
        var context = new ControllerContext { HttpContext = new DefaultHttpContext { User = claimsPrincipal } };
        
        _sut = _mocker.Create<ParticipantsController>();
        _sut.ControllerContext = context;
    }

    [Test]
    public async Task Should_return_ok()
    {
        var conferenceId = _testConference.Id;
        var participantId = Guid.NewGuid();
        var request = new UpdateParticipantDisplayNameRequest { DisplayName = "contactEmail" };

        _mocker.Mock<IVideoApiClient>()
            .Setup(x => x.UpdateParticipantDetailsAsync(conferenceId, It.IsAny<Guid>(),
                It.Is<UpdateParticipantRequest>(participantRequest =>
                    request.DisplayName == participantRequest.DisplayName)))
            .Returns(Task.FromResult(default(object)));

        _mocker.Mock<IConferenceService>()
            .Setup(x => x.GetConference(conferenceId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Conference()
            {
                Id = conferenceId,
                Participants =
                [
                    new()
                    {
                        Id = participantId,
                        Username = "username",
                        DisplayName = "newDisplayName",
                        ContactEmail = "contactEmail",
                        LinkedParticipants = null,
                        FirstName = "FirstName",
                        LastName = "LastName",
                        Role = Role.Judge,
                        ParticipantStatus = ParticipantStatus.Available,
                        Representee = "Representee",
                        HearingRole = "HearingRole"
                    }
                ]
            });

        var result =
            await _sut.UpdateParticipantDisplayNameAsync(conferenceId, participantId, request, CancellationToken.None);
        var typedResult = (NoContentResult)result;
        typedResult.Should().NotBeNull();
        _mocker.Mock<IConferenceService>()
            .Verify(x => x.GetConference(conferenceId, It.IsAny<CancellationToken>()), Times.Once);
        _mocker.Mock<IConferenceService>()
            .Verify(x => x.UpdateConferenceAsync(It.Is<Conference>(c => c.Id == conferenceId), It.IsAny<CancellationToken>()), Times.Once);
        _mocker.Mock<IParticipantsUpdatedEventNotifier>()
            .Verify(
                x => x.PushParticipantsUpdatedEvent(It.Is<Conference>(c => c.Id == conferenceId), It.IsAny<IList<Participant>>()), Times.Once);
    }
}
