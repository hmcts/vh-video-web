using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading;
using System.Threading.Tasks;
using VideoWeb.Common.Models;
using VideoWeb.Controllers;
using VideoApi.Client;
using VideoWeb.UnitTests.Builders;
using Autofac.Extras.Moq;
using FizzWare.NBuilder;
using VideoApi.Contract.Enums;
using VideoApi.Contract.Responses;
using VideoWeb.Common;
using ParticipantResponse = VideoApi.Contract.Responses.ParticipantResponse;
using VideoWeb.EventHub.Handlers.Core;
using VideoWeb.Helpers.Interfaces;

namespace VideoWeb.UnitTests.Controllers.ParticipantController;

public class DeleteParticipantTests
{
    private AutoMock _mocker;
    private ParticipantsController _sut;
    
    [SetUp]
    public void Setup()
    {
        _mocker = AutoMock.GetLoose();
        
        var claimsPrincipal = new ClaimsPrincipalBuilder().WithRole(AppRoles.StaffMember).Build();
        var context = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = claimsPrincipal
            }
        };
        _sut = _mocker.Create<ParticipantsController>();
        _sut.ControllerContext = context;
    }
    
    [Test]
    public async Task Should_return_ok()
    {
        var conference = CreateValidConference();
        var participant = conference.Participants.First(x=> x.Role == Role.QuickLinkParticipant);
        participant.ParticipantStatus = ParticipantStatus.Disconnected;
        
        _mocker.Mock<IVideoApiClient>()
            .Setup(x => x.RemoveParticipantFromConferenceAsync(conference.Id, participant.Id, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        
        _mocker.Mock<IConferenceService>()
            .Setup(x => x.GetConference(conference.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(conference);

        var result = await _sut.RemoveParticipantFromConferenceAsync(conference.Id, participant.Id, CancellationToken.None);
        var typedResult = (NoContentResult)result;
        typedResult.Should().NotBeNull();

        _mocker.Mock<IVideoApiClient>()
            .Verify(
                x => x.RemoveParticipantFromConferenceAsync(conference.Id, participant.Id,
                    It.IsAny<CancellationToken>()), Times.Once);
        conference.Participants.Should().NotContain(x=> x.Id == participant.Id);
        _mocker.Mock<IParticipantsUpdatedEventNotifier>().Verify(
            x => x.PushParticipantsUpdatedEvent(It.IsAny<Conference>(), It.IsAny<IList<Participant>>()), Times.Once);
    }

    [Test]
    public async Task should_return_bad_request_if_participant_is_not_disconnected()
    {
        var conference = CreateValidConference();
        var participant = conference.Participants.First(x=> x.Role == Role.QuickLinkParticipant);
        participant.ParticipantStatus = ParticipantStatus.Available;
        
        
        _mocker.Mock<IConferenceService>()
            .Setup(x => x.GetConference(conference.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(conference);

        var result = await _sut.RemoveParticipantFromConferenceAsync(conference.Id, participant.Id, CancellationToken.None);
        
        result.Should().BeOfType<ObjectResult>().Which.Value.Should().BeOfType<ValidationProblemDetails>()
            .Subject.Errors.Should().ContainKey("participantId")
            .WhoseValue.Contains("Participant is not disconnected").Should()
            .BeTrue();

        conference.Participants.Should().Contain(x=> x.Id == participant.Id);
        _mocker.Mock<IVideoApiClient>()
            .Verify(
                x => x.RemoveParticipantFromConferenceAsync(conference.Id, participant.Id,
                    It.IsAny<CancellationToken>()), Times.Never);
        conference.Participants.Should().Contain(x=> x.Id == participant.Id);
        _mocker.Mock<IParticipantsUpdatedEventNotifier>().Verify(
            x => x.PushParticipantsUpdatedEvent(It.IsAny<Conference>(), It.IsAny<IList<Participant>>()), Times.Never);
    }
    
    private static Conference CreateValidConference()
    {
        var conference = new ConferenceCacheModelBuilder().Build();
        
        var qlParticipant = Builder<Participant>.CreateNew().With(x => x.Role = Role.QuickLinkParticipant)
            .With(x => x.HearingRole = "Quick link participant")
            .With(x => x.Username = Faker.Internet.Email("quicklinkparticipant1"))
            .With(x => x.Id = Guid.NewGuid()).Build();
        conference.AddParticipant(qlParticipant);
        
        return conference;
    }

}
