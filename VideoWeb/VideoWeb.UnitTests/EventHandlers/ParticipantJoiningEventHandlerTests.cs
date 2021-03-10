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
    public class ParticipantJoiningEventHandlerTests : EventHandlerTestBase
    {
        private ParticipantJoiningEventHandler _eventHandler;

        [Test]
        public async Task Should_send_joining_message_to_participants_and_service_bus_when_a_participant_is_joining()
        {
            _eventHandler = new ParticipantJoiningEventHandler(EventHubContextMock.Object, ConferenceCache,
                LoggerMock.Object, VideoApiClientMock.Object);

            var conference = TestConference;
            var participantForEvent = conference.Participants.First(x => x.Role == Role.Individual);
            var participantCount = conference.Participants.Count + 1; // plus one for admin

            var callbackEvent = new CallbackEvent
            {
                EventType = EventType.Joined,
                EventId = Guid.NewGuid().ToString(),
                ConferenceId = conference.Id,
                ParticipantId = participantForEvent.Id,
                TimeStampUtc = DateTime.UtcNow
            };

            await _eventHandler.HandleAsync(callbackEvent);

            EventHubClientMock.Verify(
                x => x.ParticipantStatusMessage(_eventHandler.SourceParticipant.Id, _eventHandler.SourceParticipant.Username, conference.Id,
                    ParticipantState.Joining), Times.Exactly(participantCount));
        }
    }
}
