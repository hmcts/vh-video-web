
using Autofac.Extras.Moq;
using FizzWare.NBuilder;
using FluentAssertions;
using Moq;
using NUnit.Framework;
using System;
using System.Security.Claims;
using System.Threading.Tasks;
using VideoApi.Contract.Consts;
using VideoApi.Contract.Enums;
using VideoApi.Contract.Requests;
using VideoApi.Contract.Responses;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.EventHub.Exceptions;
using VideoWeb.Helpers.Interfaces;
using VideoWeb.Mappings;
using VideoWeb.Mappings.Interfaces;
using VideoWeb.Services;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.Services
{
    [TestFixture]
    public class ParticipantsServiceTests
    {
        private AutoMock _mocker;
        private ConferenceDetailsResponse _testConference;
        private ParticipantDetailsResponse _participantDetailsResponse;
        private IParticipantService _service;
        private UserProfileResponse _staffMemberProfile;
        private const string ContactEmail = "staffMemberEmail@hmcts.net";
        private ClaimsPrincipal _claimsPrincipal;

        [SetUp]
        public void Setup()
        {
            _mocker = AutoMock.GetLoose();
            _testConference = Builder<ConferenceDetailsResponse>.CreateNew().Build();
            _participantDetailsResponse = Builder<ParticipantDetailsResponse>.CreateNew().Build();
            _service = _mocker.Create<ParticipantService>();
            _staffMemberProfile = new UserProfileResponse
            {
                FirstName = "FirstName",
                LastName = "LastName",
                Username = "Username",
                DisplayName = "DisplayName",
                Name = "FullName"
            };
            _claimsPrincipal = new ClaimsPrincipalBuilder().WithRole(Role.StaffMember.ToString()).Build();
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
            var result = _service.InitialiseAddStaffMemberRequest(_staffMemberProfile, ContactEmail, _claimsPrincipal);
            result.Should().Equals(new AddStaffMemberRequest
            {
                FirstName = _staffMemberProfile.FirstName,
                LastName = _staffMemberProfile.LastName,
                Username = _staffMemberProfile.Username,
                HearingRole = HearingRoleName.StaffMember,
                Name = _claimsPrincipal.Identity.Name,
                DisplayName = _staffMemberProfile.DisplayName,
                UserRole = UserRole.StaffMember,
                ContactEmail = ContactEmail
            });
        }

        [Test]
        public async Task Should_update_conference_cache()
        {
            // Arrange
            var conference = new Conference();

            _mocker.Mock<IMapTo<ConferenceDetailsResponse, Conference>>()
                .Setup(x => x.Map(It.Is<ConferenceDetailsResponse>(x => x == _testConference)))
                .Returns(conference);

            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<ConferenceDetailsResponse, Conference>())
                .Returns(_mocker.Mock<IMapTo<ConferenceDetailsResponse, Conference>>().Object);

            // Act
            await _service.UpdateConferenceCache(_testConference);

            // Assert
            _mocker.Mock<IConferenceCache>()
                .Verify(x => x.UpdateConferenceAsync(It.Is<Conference>(y => y == conference)), Times.Once());

            _mocker.Mock<IParticipantsUpdatedEventNotifier>()
                .Verify(x => x.PushParticipantsUpdatedEvent(conference), Times.Once);
        }

        [Test]
        public async Task AddStaffMemberToConferenceCache_Updates_UpdateConferenceAsync()
        {
            // Arrange
            var conference = new Conference();
            var participantResponse = new Participant();
            var addStaffMemberResponse = new AddStaffMemberResponse();
            _mocker.Mock<IConferenceCache>().Setup(x => x.GetOrAddConferenceAsync(It.IsAny<Guid>(), It.IsAny<Func<Task<ConferenceDetailsResponse>>>())).Returns(Task.FromResult(conference));
            _mocker.Mock<IMapTo<ParticipantDetailsResponse, Participant>>()
               .Setup(x => x.Map(It.Is<ParticipantDetailsResponse>(x => x == _participantDetailsResponse)))
               .Returns(participantResponse);

            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<ParticipantDetailsResponse, Participant>())
                .Returns(_mocker.Mock<IMapTo<ParticipantDetailsResponse, Participant>>().Object);

            //Act
            await _service.AddStaffMemberToConferenceCache(addStaffMemberResponse);

            // Assert
            _mocker.Mock<IConferenceCache>()
                .Verify(x => x.UpdateConferenceAsync(It.Is<Conference>(y => y == conference)), Times.Once());
            _mocker.Mock<IParticipantsUpdatedEventNotifier>()
                .Verify(x => x.PushParticipantsUpdatedEvent(It.Is<Conference>(y => y == conference)), Times.Once());
        }

        [Test]
        public async Task AddStaffMemberToConferenceCache_when_coference_is_in_cache()
        {
            // Arrange
            var conference = new Conference();

            _mocker.Mock<IConferenceCache>().Setup(x => x.GetOrAddConferenceAsync(It.IsAny<Guid>(), It.IsAny<Func<Task<ConferenceDetailsResponse>>>())).Returns(Task.FromResult(conference));

            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<ParticipantDetailsResponse, Participant>())
                .Returns(_mocker.Mock<IMapTo<ParticipantDetailsResponse, Participant>>().Object);

            var addStaffMemberResponse = new AddStaffMemberResponse
            {
                ConferenceId = Guid.NewGuid(),
                ParticipantDetails = _participantDetailsResponse
            };

            // Act
            await _service.AddStaffMemberToConferenceCache(addStaffMemberResponse);

            // Assert
            _mocker.Mock<IConferenceCache>()
                .Verify(x => x.UpdateConferenceAsync(It.Is<Conference>(y => y == conference)), Times.Once());
            _mocker.Mock<IParticipantsUpdatedEventNotifier>()
                .Verify(x => x.PushParticipantsUpdatedEvent(It.Is<Conference>(y => y == conference)), Times.Once());
        }

        [Test]
        public void AddStaffMemberToConferenceCache_when_coference_is_NULL()
        {
            // Arrange
            _mocker.Mock<IConferenceCache>().Setup(x => x.GetOrAddConferenceAsync(It.IsAny<Guid>(), It.IsAny<Func<Task<ConferenceDetailsResponse>>>())).Returns(Task.FromResult(null as Conference));
            var addStaffMemberResponse = new AddStaffMemberResponse
            {
                ConferenceId = Guid.NewGuid(),
                ParticipantDetails = _participantDetailsResponse
            };

            // Act and Assert
            Assert.ThrowsAsync<ConferenceNotFoundException>(async () => await _service.AddStaffMemberToConferenceCache(addStaffMemberResponse));
        }

        [Test]
        public async Task AddStaffMemberToConferenceCache_when_coference_is_mapping_Participantdetails_to_participant()
        {
            // Arrange
            var conference = new Conference();
            var participantResponse = new Participant();

            _mocker.Mock<IConferenceCache>()
                .Setup(x => x.GetOrAddConferenceAsync(It.IsAny<Guid>(), It.IsAny<Func<Task<ConferenceDetailsResponse>>>()))
                .Returns(Task.FromResult(conference));

            _mocker.Mock<IMapTo<ParticipantDetailsResponse, Participant>>()
               .Setup(x => x.Map(It.Is<ParticipantDetailsResponse>(x => x == _participantDetailsResponse)))
               .Returns(participantResponse);

            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<ParticipantDetailsResponse, Participant>())
                .Returns(_mocker.Mock<IMapTo<ParticipantDetailsResponse, Participant>>().Object);

            var addStaffMemberResponse = new AddStaffMemberResponse
            {
                ConferenceId = Guid.NewGuid(),
                ParticipantDetails = _participantDetailsResponse
            };

            // Act
            await _service.AddStaffMemberToConferenceCache(addStaffMemberResponse);

            // Assert
            conference.Participants.Count.Should().Be(1);
        }
    }
}
