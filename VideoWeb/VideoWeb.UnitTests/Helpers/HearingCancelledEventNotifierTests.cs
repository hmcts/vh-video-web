using System;
using System.Linq;
using System.Threading.Tasks;
using Bogus;
using FizzWare.NBuilder;
using Microsoft.AspNetCore.SignalR;
using Moq;
using NUnit.Framework;
using VideoWeb.Common.Models;
using VideoWeb.EventHub.Hub;
using VideoWeb.Helpers;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.Helpers
{
    public class HearingCancelledEventNotifierTests
    {
        private HearingCancelledEventNotifier _notifier;
        private Conference _conference;
        private EventComponentHelper _eventHelper;
        private static readonly Faker Faker = new();

        [SetUp]
        public void SetUp()
        {
            _conference = new ConferenceCacheModelBuilder().Build();
            _eventHelper = new EventComponentHelper
            {
                EventHubContextMock = new Mock<IHubContext<EventHub.Hub.EventHub, IEventHubClient>>(),
                EventHubClientMock = new Mock<IEventHubClient>()
            };
            _eventHelper.RegisterUsersForHubContext(_conference.Participants);
            _notifier = new HearingCancelledEventNotifier(_eventHelper.EventHubContextMock.Object);
        }

        [Test]
        public async Task should_publish_message()
        {
            // Arrange & Act
            await _notifier.PushHearingCancelledEvent(_conference);
            
            // Assert
            const int vhoCount = 1;
            const int staffMemberCount = 1;
            _eventHelper.EventHubClientMock.Verify(x => x.HearingCancelledMessage(_conference.Id), Times.Exactly(_conference.Participants.Count + vhoCount + staffMemberCount));
        }

        [Test]
        public async Task should_only_publish_one_message_to_staff_member_participants()
        {
            // Arrange
            AddParticipantToConference(Role.StaffMember);
            
            // Act
            await _notifier.PushHearingCancelledEvent(_conference);
            
            // Assert
            const int vhoCount = 1;
            const int nonParticipantStaffMemberCount = 1; // Non-participant staff member = a staff member who is not a participant on the conference
            var nonStaffMemberParticipantCount = _conference.Participants.Count(p => p.Role != Role.StaffMember); // Non-staff member participants = participants minus staff members
            var expectedMessageCount = nonParticipantStaffMemberCount + vhoCount + nonStaffMemberParticipantCount;
            _eventHelper.EventHubClientMock.Verify(x => x.HearingCancelledMessage(_conference.Id), Times.Exactly(expectedMessageCount));
        }
        
        private void AddParticipantToConference(Role role)
        {
            var staffMemberParticipant = Builder<Participant>.CreateNew()
                .With(x => x.Role = role).With(x => x.Id = Guid.NewGuid())
                .With(x => x.Username = Faker.Internet.Email())
                .Build();
        
            _conference.Participants.Add(staffMemberParticipant);
            _eventHelper.RegisterParticipantForHubContext(staffMemberParticipant);
        }
    }
}
