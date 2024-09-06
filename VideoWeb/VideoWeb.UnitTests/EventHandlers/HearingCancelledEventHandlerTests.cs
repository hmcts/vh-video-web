using System;
using System.Linq;
using System.Threading.Tasks;
using Moq;
using NUnit.Framework;
using VideoWeb.Common.Models;
using VideoWeb.EventHub.Enums;
using VideoWeb.EventHub.Handlers;
using VideoWeb.EventHub.Models;

namespace VideoWeb.UnitTests.EventHandlers
{
    public class HearingCancelledEventHandlerTests : EventHandlerTestBase
    {
        private HearingCancelledEventHandler _eventHandler;

        [Test]
        public async Task should_publish_message()
        {
            _eventHandler = new HearingCancelledEventHandler(EventHubContextMock.Object, ConferenceServiceMock.Object, LoggerMock.Object);

            var conference = TestConference;
            var callbackEvent = new CallbackEvent
            {
                EventType = EventType.HearingCancelled,
                ConferenceId = conference.Id,
                EventId = Guid.NewGuid().ToString(),
                TimeStampUtc = DateTime.UtcNow
            };

            await _eventHandler.HandleAsync(callbackEvent);
            
            const int vhoCount = 1;
            const int staffMemberCount = 1;
            EventHubClientMock.Verify(x => x.HearingCancelledMessage(callbackEvent.ConferenceId), Times.Exactly(TestConference.Participants.Count + vhoCount + staffMemberCount));
        }

        [Test]
        public async Task should_only_publish_one_message_to_staff_member_participants()
        {
            _eventHandler = new HearingCancelledEventHandler(EventHubContextMock.Object, ConferenceServiceMock.Object, LoggerMock.Object);

            var conference = TestConference;
            var callbackEvent = new CallbackEvent
            {
                EventType = EventType.HearingCancelled,
                ConferenceId = conference.Id,
                EventId = Guid.NewGuid().ToString(),
                TimeStampUtc = DateTime.UtcNow
            };
            AddParticipantToConference(Role.StaffMember);

            await _eventHandler.HandleAsync(callbackEvent);
            
            const int vhoCount = 1;
            const int nonParticipantStaffMemberCount = 1; // Non-participant staff member = a staff member who is not a participant on the conference
            var nonStaffMemberParticipantCount = conference.Participants.Count(p => p.Role != Role.StaffMember); // Non-staff member participants = participants minus staff members
            var expectedMessageCount = nonParticipantStaffMemberCount + vhoCount + nonStaffMemberParticipantCount;
            EventHubClientMock.Verify(x => x.HearingCancelledMessage(callbackEvent.ConferenceId), Times.Exactly(expectedMessageCount));
        }
    }
}
