
using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Autofac.Extras.Moq;
using FizzWare.NBuilder;
using FluentAssertions;
using Moq;
using NUnit.Framework;
using VideoApi.Contract.Consts;
using VideoApi.Contract.Enums;
using VideoApi.Contract.Requests;
using VideoApi.Contract.Responses;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
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
        private IParticipantService _service;
        private UserProfileResponse _staffMemberProfile;
        private const string ContactEmail = "staffMemberEmail@hmcts.net";
        private ClaimsPrincipal _claimsPrincipal;

        [SetUp]
        public void Setup()
        {
            _mocker = AutoMock.GetLoose();
            _testConference = Builder<ConferenceDetailsResponse>.CreateNew().Build();
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
    }
}
