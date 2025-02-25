using System;
using System.Collections.Generic;
using System.Net;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using Autofac.Extras.Moq;
using FizzWare.NBuilder;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using VideoApi.Contract.Enums;
using VideoWeb.Common;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Controllers;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.Controllers.ConferenceController;

public class GetConferenceByIdVhoTests
{
    private AutoMock _mocker;
    private ConferencesController _sut;
    
    [SetUp]
    public void Setup()
    {
        _mocker = AutoMock.GetLoose();
        
        var claimsPrincipal = new ClaimsPrincipalBuilder().WithRole(AppRoles.VhOfficerRole).Build();
        _sut = SetupControllerWithClaims(claimsPrincipal);
    }
    
    [Test]
    public async Task Should_return_ok()
    {
        var conference = CreateValidConferenceDto();
        var testParticipant = conference.Participants[0];
        testParticipant.Role = Role.Individual;
        _mocker.Mock<IConferenceService>()
            .Setup(x => x.GetConference(conference.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(conference);
        
        var result = await _sut.GetConferenceByIdVhoAsync(conference.Id, It.IsAny<CancellationToken>());
        var typedResult = (OkObjectResult)result.Result;
        typedResult.Should().NotBeNull();
        var response = (ConferenceResponse)typedResult.Value;
        response.Participants.Find(e => e.Id == testParticipant.Id).Role.Should().Be((Role)UserRole.Individual);
    }
    
    [Test]
    public async Task Should_return_bad_request()
    {
        var result = await _sut.GetConferenceByIdVhoAsync(Guid.Empty, CancellationToken.None);
        
        var typedResult = (BadRequestObjectResult)result.Result;
        typedResult.Should().NotBeNull();
    }
    
    [Test]
    public async Task Should_return_unauthorised_if_waiting_room_closed()
    {
        var conference = CreateValidConferenceDto();
        conference.IsWaitingRoomOpen = false;
        
        _mocker.Mock<IConferenceService>()
            .Setup(x => x.GetConference(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(conference);
        
        var result = await _sut.GetConferenceByIdVhoAsync(Guid.NewGuid(), CancellationToken.None);
        var typedResult = result.Result as UnauthorizedResult;
        typedResult.Should().NotBeNull();
        typedResult?.StatusCode.Should().Be((int)HttpStatusCode.Unauthorized);
    }
    
    private static Conference CreateValidConferenceDto()
    {
        var judge = new ParticipantBuilder(Role.Judge).Build();
        var individualDefendant = new ParticipantBuilder(Role.Individual).Build();
        var individualClaimant = new ParticipantBuilder(Role.Individual).Build();
        var repClaimant = new ParticipantBuilder(Role.Representative).Build();
        var panelMember = new ParticipantBuilder(Role.JudicialOfficeHolder).Build();
        
        var participants = new List<Participant>()
        {
            individualDefendant, individualClaimant, repClaimant, judge, panelMember
        };
        
        var conference = Builder<Conference>.CreateNew()
            .With(x => x.Participants = participants)
            .With(x => x.IsWaitingRoomOpen = true)
            .Build();
        return conference;
    }
    
    private ConferencesController SetupControllerWithClaims(ClaimsPrincipal claimsPrincipal)
    {
        var context = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = claimsPrincipal
            }
        };
        
        var controller = _mocker.Create<ConferencesController>();
        controller.ControllerContext = context;
        return controller;
    }
    
}
