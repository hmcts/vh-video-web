using Autofac.Extras.Moq;
using FizzWare.NBuilder;
using FluentAssertions;
using Moq;
using NUnit.Framework;
using System;
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
using VideoWeb.Mappings;
using VideoWeb.Mappings.Interfaces;
using VideoWeb.Services;
using VideoWeb.UnitTests.Builders;
using ParticipantResponse = VideoApi.Contract.Responses.ParticipantResponse;

namespace VideoWeb.UnitTests.Services;

[TestFixture]
public class ParticipantsServiceTests
{
    private AutoMock _mocker;
    private ConferenceDetailsResponse _testConference;
    private ParticipantResponse _ParticipantResponse;
    private ParticipantService _service;
    private UserProfileResponse _staffMemberProfile;
    private const string ContactEmail = "staffMemberEmail@hmcts.net";
    
    [SetUp]
    public void Setup()
    {
        _mocker = AutoMock.GetLoose();
        _testConference = Builder<ConferenceDetailsResponse>.CreateNew().Build();
        _ParticipantResponse = Builder<ParticipantResponse>.CreateNew().Build();
        _service = _mocker.Create<ParticipantService>();
        _staffMemberProfile = new UserProfileResponse
        {
            FirstName = "FirstName",
            LastName = "LastName",
            Username = "Username",
            DisplayName = "DisplayName",
            Name = "FullName"
        };
        new ClaimsPrincipalBuilder().WithRole(Role.StaffMember.ToString()).Build();
        _mocker.Mock<IConferenceService>().Setup(x => x.ConferenceCache).Returns(_mocker.Mock<IConferenceCache>().Object);
    }
    
    [Test]
    public void Should_return_true_when_hearing_is_starting_soon()
    {
        _testConference.ScheduledDateTime = DateTime.UtcNow;
        var result = _service.CanStaffMemberJoinConference(_testConference);
        result.Should().BeTrue();
    }
    
    [Test]
    public void Should_return_false_when_hearing_is_starting_soon()
    {
        _testConference.ScheduledDateTime = DateTime.UtcNow.AddHours(1);
        _testConference.ClosedDateTime = DateTime.UtcNow.AddHours(-3);
        var result = _service.CanStaffMemberJoinConference(_testConference);
        result.Should().BeFalse();
    }
    
    
    [Test]
    public void Should_return_addStaffMemberRequest()
    {
        var result = _service.InitialiseAddStaffMemberRequest(_staffMemberProfile, ContactEmail);
        result.Should().BeEquivalentTo(new AddStaffMemberRequest
        {
            FirstName = _staffMemberProfile.FirstName,
            LastName = _staffMemberProfile.LastName,
            Username = _staffMemberProfile.Username,
            HearingRole = HearingRoleName.StaffMember,
            Name = _staffMemberProfile.Name,
            DisplayName = _staffMemberProfile.DisplayName,
            UserRole = UserRole.StaffMember,
            ContactEmail = ContactEmail
        });
    }
    
    [Test]
    public async Task AddStaffMemberToConferenceCache_Updates_UpdateConferenceAsync()
    {
        // Arrange
        var conference = new Conference();
        var participantResponse = new Participant();
        var addStaffMemberResponse = new AddStaffMemberResponse();
        _mocker.Mock<IConferenceService>().Setup(x => x.GetConference(It.IsAny<Guid>())).Returns(Task.FromResult(conference));
        _mocker.Mock<IMapTo<ParticipantResponse, Participant>>()
            .Setup(x => x.Map(It.Is<ParticipantResponse>(x => x == _ParticipantResponse)))
            .Returns(participantResponse);
        
        _mocker.Mock<IMapperFactory>().Setup(x => x.Get<ParticipantResponse, Participant>())
            .Returns(_mocker.Mock<IMapTo<ParticipantResponse, Participant>>().Object);
        
        //Act
        await _service.AddStaffMemberToConferenceCache(addStaffMemberResponse);
        
        // Assert
        _mocker.Mock<IConferenceCache>()
            .Verify(x => x.UpdateConferenceAsync(It.Is<Conference>(y => y == conference)), Times.Once());
        _mocker.Mock<IParticipantsUpdatedEventNotifier>()
            .Verify(x => x.PushParticipantsUpdatedEvent(It.Is<Conference>(y => y == conference), conference.Participants), Times.Once());
    }
    
    [Test]
    public async Task AddStaffMemberToConferenceCache_when_coference_is_in_cache()
    {
        // Arrange
        var conference = new Conference();
        
        _mocker.Mock<IConferenceService>().Setup(x => x.GetConference(It.IsAny<Guid>())).Returns(Task.FromResult(conference));
        
        _mocker.Mock<IMapperFactory>().Setup(x => x.Get<ParticipantResponse, Participant>())
            .Returns(_mocker.Mock<IMapTo<ParticipantResponse, Participant>>().Object);
        
        var addStaffMemberResponse = new AddStaffMemberResponse
        {
            ConferenceId = Guid.NewGuid(),
            Participant = _ParticipantResponse
        };
        
        // Act
        await _service.AddStaffMemberToConferenceCache(addStaffMemberResponse);
        
        // Assert
        _mocker.Mock<IConferenceCache>()
            .Verify(x => x.UpdateConferenceAsync(It.Is<Conference>(y => y == conference)), Times.Once());
        _mocker.Mock<IParticipantsUpdatedEventNotifier>()
            .Verify(x => x.PushParticipantsUpdatedEvent(It.Is<Conference>(y => y == conference), conference.Participants), Times.Once());
    }
    
    [Test]
    public void AddStaffMemberToConferenceCache_when_coference_is_NULL()
    {
        // Arrange
        _mocker.Mock<IConferenceService>().Setup(x => x.GetConference(It.IsAny<Guid>())).Returns(Task.FromResult(null as Conference));
        var addStaffMemberResponse = new AddStaffMemberResponse
        {
            ConferenceId = Guid.NewGuid(),
            Participant = _ParticipantResponse
        };
        
        // Act and Assert
        Assert.ThrowsAsync<ConferenceNotFoundException>(async () => await _service.AddStaffMemberToConferenceCache(addStaffMemberResponse));
    }
    
    [Test]
    public async Task AddStaffMemberToConferenceCache_when_coference_is_mapping_Participant_to_participant()
    {
        // Arrange
        var conference = new Conference();
        var participantResponse = new Participant();
        
        
        _mocker.Mock<IConferenceService>().Setup(x => x.GetConference(It.IsAny<Guid>())).Returns(Task.FromResult(conference));
        
        _mocker.Mock<IMapTo<ParticipantResponse, Participant>>()
            .Setup(x => x.Map(It.Is<ParticipantResponse>(x => x == _ParticipantResponse)))
            .Returns(participantResponse);
        
        _mocker.Mock<IMapperFactory>().Setup(x => x.Get<ParticipantResponse, Participant>())
            .Returns(_mocker.Mock<IMapTo<ParticipantResponse, Participant>>().Object);
        
        var addStaffMemberResponse = new AddStaffMemberResponse
        {
            ConferenceId = Guid.NewGuid(),
            Participant = _ParticipantResponse
        };
        
        // Act
        await _service.AddStaffMemberToConferenceCache(addStaffMemberResponse);
        
        // Assert
        conference.Participants.Count.Should().Be(1);
    }
}
