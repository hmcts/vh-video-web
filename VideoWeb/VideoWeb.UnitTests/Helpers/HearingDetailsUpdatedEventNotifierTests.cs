using System;
using System.Linq;
using System.Threading.Tasks;
using FizzWare.NBuilder;
using Microsoft.AspNetCore.SignalR;
using Moq;
using NUnit.Framework;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.EventHub.Hub;
using VideoWeb.Helpers;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.Helpers
{
    public class HearingDetailsUpdatedEventNotifierTests
    {
        private HearingDetailsUpdatedEventNotifier _notifier;
        private Conference _conference;
        private EventComponentHelper _eventHelper;

        [SetUp]
        public void SetUp()
        {
            _conference = new ConferenceCacheModelBuilder().Build();
            _eventHelper = new EventComponentHelper
            {
                EventHubContextMock = new Mock<IHubContext<EventHub.Hub.EventHubVIH11189, IEventHubClient>>(),
                EventHubClientMock = new Mock<IEventHubClient>()
            };
            _eventHelper.RegisterUsersForHubContext(_conference.Participants);
            _notifier = new HearingDetailsUpdatedEventNotifier(_eventHelper.EventHubContextMock.Object);
        }

        [Test]
        public async Task should_publish_message()
        {
            // Arrange & Act
            await _notifier.PushHearingDetailsUpdatedEvent(_conference);
            
            // Assert
            const int vhoCount = 1;
            const int staffMemberCount = 1;
            var expectedMessageCount = _conference.Participants.Count + vhoCount + staffMemberCount;
            VerifyHearingDetailsUpdatedMessagePublished(expectedMessageCount);
        }

        [Test]
        public async Task should_only_publish_one_message_to_staff_member_participants()
        {
            // Arrange
            AddParticipantToConference(Role.StaffMember);
            
            // Act
            await _notifier.PushHearingDetailsUpdatedEvent(_conference);
            
            // Assert
            const int vhoCount = 1;
            const int nonParticipantStaffMemberCount = 1; // Non-participant staff member = a staff member who is not a participant on the conference
            var nonStaffMemberParticipantCount = _conference.Participants.Count(p => p.Role != Role.StaffMember); // Non-staff member participants = participants minus staff members
            var expectedMessageCount = nonParticipantStaffMemberCount + vhoCount + nonStaffMemberParticipantCount;
            VerifyHearingDetailsUpdatedMessagePublished(expectedMessageCount);
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

        private void VerifyHearingDetailsUpdatedMessagePublished(int times)
        {
            _eventHelper.EventHubClientMock.Verify(x => x.HearingDetailsUpdatedMessage(It.Is<ConferenceResponse>(r => 
                r.Id == _conference.Id)), 
                Times.Exactly(times));
        }
    }
}
