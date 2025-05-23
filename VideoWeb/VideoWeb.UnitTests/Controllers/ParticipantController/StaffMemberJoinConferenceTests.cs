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
using VideoApi.Contract.Consts;
using VideoApi.Contract.Enums;
using VideoApi.Contract.Requests;
using VideoApi.Contract.Responses;
using VideoWeb.Common;
using VideoWeb.Services;
using LinkedParticipantResponse = VideoApi.Contract.Responses.LinkedParticipantResponse;
using ParticipantResponse = VideoApi.Contract.Responses.ParticipantResponse;

namespace VideoWeb.UnitTests.Controllers.ParticipantController;

public class StaffMemberJoinConferenceTests
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
        var addStaffMemberRequest = new AddStaffMemberRequest()
        {
            Username = "Staff_UserName",
            HearingRole = HearingRoleName.StaffMember,
            Name = "FullName",
            DisplayName = "DisplayName",
            UserRole = UserRole.StaffMember,
            ContactEmail = "FirstName_LastName@hmcts.net"
        };
        var staffMemberResponse = new AddStaffMemberResponse()
        {
            ConferenceId = conferenceId,
            Participant = new ParticipantResponse()
            {
                Id = Guid.NewGuid(),
                ContactEmail = addStaffMemberRequest.ContactEmail,
                DisplayName = addStaffMemberRequest.DisplayName,
                Username = addStaffMemberRequest.Username,
                RefId = Guid.NewGuid(),
                CurrentRoom = null,
                CurrentInterpreterRoom = null,
                UserRole = UserRole.StaffMember,
                CurrentStatus = ParticipantState.NotSignedIn,
                LinkedParticipants = new List<LinkedParticipantResponse>()
            }
        };
        
        _mocker.Mock<IParticipantService>().Setup(x => x.CanStaffMemberJoinConference(_testConference))
            .Returns(true);
        _mocker.Mock<IVideoApiClient>()
            .Setup(x => x.GetConferenceDetailsByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(_testConference);
        _mocker.Mock<IConferenceService>().Setup(x => x.GetConference(conferenceId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(CreateConferenceDto());
        _mocker.Mock<IVideoApiClient>()
            .Setup(x => x.AddStaffMemberToConferenceAsync(It.IsAny<Guid>(), It.IsAny<AddStaffMemberRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(staffMemberResponse);
        
        var result = await _sut.StaffMemberJoinConferenceAsync(conferenceId, CancellationToken.None);
        var typedResult = (OkObjectResult)result;
        typedResult.Should().NotBeNull();
    }
    
    [Test]
    public async Task Should_throw_error_when_CanStaffMemberJoinConference_return_false()
    {
        var conferenceId = _testConference.Id;
        
        _mocker.Mock<IVideoApiClient>()
            .Setup(x => x.GetConferenceDetailsByIdAsync(It.IsAny<Guid>()))
            .ReturnsAsync(_testConference);
        _mocker.Mock<IParticipantService>().Setup(x => x.CanStaffMemberJoinConference(_testConference))
            .Returns(false);
        
        var result = await _sut.StaffMemberJoinConferenceAsync(conferenceId, CancellationToken.None);
        var typedResult = (ObjectResult)result;
        typedResult.StatusCode.Should().Be((int)HttpStatusCode.BadRequest);
    }
    
    private static ConferenceDetailsResponse CreateValidConferenceResponse(string username = "john@hmcts.net")
    {
        var judge = new ParticipantResponseBuilder(UserRole.Judge).Build();
        var staffMember = new ParticipantResponseBuilder(UserRole.StaffMember).Build();
        var individualDefendant = new ParticipantResponseBuilder(UserRole.Individual).Build();
        var panelMember = new ParticipantResponseBuilder(UserRole.JudicialOfficeHolder).Build();
        var participants = new List<ParticipantResponse> { individualDefendant, judge, panelMember, staffMember };
        if (!string.IsNullOrWhiteSpace(username))
        {
            participants[0].Username = username;
        }
        
        var conference = Builder<ConferenceDetailsResponse>.CreateNew()
            .With(x => x.Participants = participants)
            .Build();
        return conference;
    }
    
    private static Conference CreateConferenceDto(string username = "john@hmcts.net")
    {
        var judge = new ParticipantBuilder(Role.Judge).Build();
        var staffMember = new ParticipantBuilder(Role.StaffMember).Build();
        
        var individualDefendant = new ParticipantBuilder(Role.Individual).Build();
        var panelMember = new ParticipantBuilder(Role.JudicialOfficeHolder).Build();
        var participants = new List<Participant>()
        {
            individualDefendant, judge, panelMember, staffMember
        };
        if (!string.IsNullOrWhiteSpace(username))
        {
            participants.First().Username = username;
        }
        
        var conference = Builder<Conference>.CreateNew()
            .With(x => x.Participants = participants)
            .Build();
        return conference;
    }
}
