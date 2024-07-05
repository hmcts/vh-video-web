using Autofac.Extras.Moq;
using FizzWare.NBuilder;
using FluentAssertions;
using Moq;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using VideoApi.Contract.Consts;
using VideoApi.Contract.Enums;
using VideoApi.Contract.Requests;
using VideoApi.Contract.Responses;
using VideoWeb.Common;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.EventHub.Exceptions;
using VideoWeb.Helpers.Interfaces;
using VideoWeb.Services;
using VideoWeb.UnitTests.Builders;
using ParticipantResponse = VideoApi.Contract.Responses.ParticipantResponse;

namespace VideoWeb.UnitTests.Services;

[TestFixture]
public class ParticipantsServiceTests
{
    private AutoMock _mocker;
    private ConferenceDetailsResponse _testConferenceResponse;
    private Conference _testConferenceCache;
    
    private ParticipantService _service;
    private const string ContactEmail = "staffMemberEmail@hmcts.net";
    
    [SetUp]
    public void Setup()
    {
        _mocker = AutoMock.GetLoose();
        _testConferenceResponse = CreateValidConferenceResponse();
        _testConferenceCache = CreateConferenceDto();
        _service = _mocker.Create<ParticipantService>();
    }
    
    [Test]
    public void Should_return_true_when_hearing_is_starting_soon()
    {
        _testConferenceResponse.ScheduledDateTime = DateTime.UtcNow;
        var result = _service.CanStaffMemberJoinConference(_testConferenceResponse);
        result.Should().BeTrue();
    }
    
    [Test]
    public void Should_return_false_when_hearing_is_starting_soon()
    {
        _testConferenceResponse.ScheduledDateTime = DateTime.UtcNow.AddHours(1);
        _testConferenceResponse.ClosedDateTime = DateTime.UtcNow.AddHours(-3);
        var result = _service.CanStaffMemberJoinConference(_testConferenceResponse);
        result.Should().BeFalse();
    }
    
    
    [Test]
    public void Should_return_addStaffMemberRequest()
    {
        var staffMemberProfile = new UserProfileResponse
        {
            FirstName = "FirstName",
            LastName = "LastName",
            Username = "Username",
            DisplayName = "DisplayName",
            Name = "FullName"
        };
        var result = _service.InitialiseAddStaffMemberRequest(staffMemberProfile, ContactEmail);
        result.Should().BeEquivalentTo(new AddStaffMemberRequest
        {
            FirstName = staffMemberProfile.FirstName,
            LastName = staffMemberProfile.LastName,
            Username = staffMemberProfile.Username,
            HearingRole = HearingRoleName.StaffMember,
            Name = staffMemberProfile.Name,
            DisplayName = staffMemberProfile.DisplayName,
            UserRole = UserRole.StaffMember,
            ContactEmail = ContactEmail
        });
    }
    
    [Test]
    public void AddParticipantToConferenceCache_when_conference_is_null()
    {
        _mocker.Mock<IConferenceService>().Setup(x => x.GetConference(It.IsAny<Guid>())).Returns(Task.FromResult(null as Conference));
        var addStaffMemberResponse = new AddStaffMemberResponse
        {
            ConferenceId = Guid.NewGuid(),
            Participant = new ParticipantResponse()
        };

        Assert.ThrowsAsync<ConferenceNotFoundException>(async () =>
            await _service.AddParticipantToConferenceCache(addStaffMemberResponse.ConferenceId,
                addStaffMemberResponse.Participant));
    }
    
    [Test]
    public async Task AddParticipantToConferenceCache_when_conference_is_in_cache()
    {
        _mocker.Mock<IConferenceService>().Setup(x=> x.GetConference(_testConferenceResponse.Id)).ReturnsAsync(_testConferenceCache);
        var staffMember = new ParticipantResponseBuilder(UserRole.StaffMember).Build();
        
        var addStaffMemberResponse = new AddStaffMemberResponse
        {
            ConferenceId = _testConferenceResponse.Id,
            Participant = staffMember
        };

        await _service.AddParticipantToConferenceCache(addStaffMemberResponse.ConferenceId,
            addStaffMemberResponse.Participant);
        
        _mocker.Mock<IConferenceService>().Verify(x => x.UpdateConferenceAsync(It.Is<Conference>(y => y == _testConferenceCache)), Times.Once());
        _mocker.Mock<IParticipantsUpdatedEventNotifier>().Verify(x => x.PushParticipantsUpdatedEvent(It.Is<Conference>(y => y == _testConferenceCache), _testConferenceCache.Participants), Times.Once());
    }

    private static ConferenceDetailsResponse CreateValidConferenceResponse(string username = "john@hmcts.net")
    {
        var judge = new ParticipantResponseBuilder(UserRole.Judge).Build();

        var individualDefendant = new ParticipantResponseBuilder(UserRole.Individual).Build();
        var panelMember = new ParticipantResponseBuilder(UserRole.JudicialOfficeHolder).Build();
        var participants = new List<ParticipantResponse> { individualDefendant, judge, panelMember };
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
            
        var individualDefendant = new ParticipantBuilder(Role.Individual).Build();
        var panelMember = new ParticipantBuilder(Role.JudicialOfficeHolder).Build();
        var participants = new List<Participant>()
        {
            individualDefendant, judge, panelMember
        };
        if (!string.IsNullOrWhiteSpace(username))
        {
            participants[0].Username = username;
        }
            
        var conference = Builder<Conference>.CreateNew()
            .With(x => x.Participants = participants)
            .Build();
        return conference;
    }
}
