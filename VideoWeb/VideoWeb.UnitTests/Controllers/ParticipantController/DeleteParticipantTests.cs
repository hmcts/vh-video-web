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

namespace VideoWeb.UnitTests.Controllers.ParticipantController;

public class DeleteParticipantTests
{
    private AutoMock _mocker;
    private ParticipantsController _sut;
    private ConferenceDetailsResponse _testConference;
    
    [SetUp]
    public void Setup()
    {
        _mocker = AutoMock.GetLoose();
        
        var claimsPrincipal = new ClaimsPrincipalBuilder().WithRole(AppRoles.StaffMember).Build();
        _testConference = CreateValidConferenceResponse();
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
        var conferenceId = _testConference.Id;
        var conference = CreateValidConference(conferenceId);

        _mocker.Mock<IVideoApiClient>()
            .Setup(x => x.RemoveParticipantFromConferenceAsync(It.IsAny<Guid>(), It.IsAny<Guid>()));
        
        _mocker.Mock<IConferenceService>()
            .Setup(x => x.ForceGetConference(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(conference);

        var eventHandlerMock = _mocker.Mock<IEventHandler>();
        _mocker.Mock<IEventHandlerFactory>().Setup(x => x.Get(It.IsAny<EventHub.Enums.EventType>())).Returns(eventHandlerMock.Object);

        var result = await _sut.RemoveParticipantFromConferenceAsync(conferenceId, It.IsAny<Guid>());
        var typedResult = (NoContentResult)result;
        typedResult.Should().NotBeNull();
    }

    
    [Test]
    public async Task Should_throw_error_when_remove_participant_from_conference()
    {
        var conferenceId = _testConference.Id;
        var participant = _testConference.Participants.First(p=>p.UserRole == UserRole.QuickLinkParticipant);
        var errorResponse = $"Unable to delete participant {participant.Id} from conference {conferenceId}";
        var videoApiException = new VideoApiException<ProblemDetails>("Bad Request", (int)HttpStatusCode.BadRequest,
            errorResponse, null, default, null); 
        
        _mocker.Mock<IVideoApiClient>()
            .Setup(x => x.RemoveParticipantFromConferenceAsync(It.IsAny<Guid>(), It.IsAny<Guid>()))
            .ThrowsAsync(videoApiException);
        
        var result = await _sut.RemoveParticipantFromConferenceAsync(conferenceId, participant.Id);
        var typedResult = (ObjectResult)result;
        typedResult.StatusCode.Should().Be((int)HttpStatusCode.BadRequest);
        typedResult.Value.Should().Be(errorResponse);
    }
    
    private static ConferenceDetailsResponse CreateValidConferenceResponse(string username = "john@hmcts.net")
    {
        var judge = new ParticipantResponseBuilder(UserRole.Judge).Build();
        var staffMember = new ParticipantResponseBuilder(UserRole.StaffMember).Build();
        var individualDefendant = new ParticipantResponseBuilder(UserRole.Individual).Build();
        var panelMember = new ParticipantResponseBuilder(UserRole.JudicialOfficeHolder).Build();
        var quickLinkParticipants = new ParticipantResponseBuilder(UserRole.QuickLinkParticipant).Build();
        var participants = new List<ParticipantResponse> { individualDefendant, judge, panelMember, staffMember, quickLinkParticipants };
        if (!string.IsNullOrWhiteSpace(username))
        {
            participants[0].Username = username;
        }
        
        var conference = Builder<ConferenceDetailsResponse>.CreateNew()
            .With(x => x.Participants = participants)
            .Build();
        return conference;
    }

    private static Conference CreateValidConference(Guid conferenceId)
    {
        var conference = Builder<Conference>.CreateNew()
            .With(x => x.Id = conferenceId)
            .With(x => x.HearingId = Guid.NewGuid())
            .With(x => x.HearingVenueName = "MyVenue")
            .Build();
        
        return conference;
    }

}
