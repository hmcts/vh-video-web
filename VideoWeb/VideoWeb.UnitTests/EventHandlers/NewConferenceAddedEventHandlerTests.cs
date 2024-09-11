using Moq;
using NUnit.Framework;
using System;
using System.Linq;
using System.Threading.Tasks;
using VideoWeb.Common.Models;
using VideoWeb.EventHub.Enums;
using VideoWeb.EventHub.Handlers;
using VideoWeb.EventHub.Models;

namespace VideoWeb.UnitTests.EventHandlers
{
    public class NewConferenceAddedEventHandlerTests : EventHandlerTestBase
    {
        private NewConferenceAddedEventHandler _eventHandler;

        [Test]
        public async Task Publish_New_Conference_Added_Event()
        {
            _eventHandler = new NewConferenceAddedEventHandler(EventHubContextMock.Object, ConferenceServiceMock.Object, LoggerMock.Object);

            var conference = TestConference;
            var callbackEvent = new CallbackEvent
            {
                EventType = EventType.NewConferenceAdded,
                ConferenceId = conference.Id,
                EventId = Guid.NewGuid().ToString(),
                TimeStampUtc = DateTime.UtcNow
            };

            await _eventHandler.HandleAsync(callbackEvent);
            
            const int vhoCount = 1;
            const int staffMemberCount = 1;
            EventHubClientMock.Verify(x => x.NewConferenceAddedMessage(callbackEvent.ConferenceId), Times.Exactly(TestConference.Participants.Count + vhoCount + staffMemberCount));
        }
        
        [Test]
        public async Task should_only_publish_one_message_to_staff_member_participants()
        {
            _eventHandler = new NewConferenceAddedEventHandler(EventHubContextMock.Object, ConferenceServiceMock.Object, LoggerMock.Object);

            var conference = TestConference;
            var callbackEvent = new CallbackEvent
            {
                EventType = EventType.NewConferenceAdded,
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
            EventHubClientMock.Verify(x => x.NewConferenceAddedMessage(callbackEvent.ConferenceId), Times.Exactly(expectedMessageCount));
        }
    }
}
