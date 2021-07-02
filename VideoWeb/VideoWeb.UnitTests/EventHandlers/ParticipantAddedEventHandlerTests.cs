using Moq;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.EventHub.Enums;
using VideoWeb.EventHub.Handlers;
using VideoWeb.EventHub.Models;

namespace VideoWeb.UnitTests.EventHandlers
{
    class ParticipantAddedEventHandlerTests : EventHandlerTestBase
    {
        private ParticipantAddedEventHandler _eventHandler;

        [Test]
        public async Task Should_send_participant_added_message_to_participants()
        {
            _eventHandler = new ParticipantAddedEventHandler(EventHubContextMock.Object, ConferenceCache,
                LoggerMock.Object, VideoApiClientMock.Object);

            var conference = TestConference;
            var participantForEvent = new Participant();
            participantForEvent.Id = new Guid();
            participantForEvent.Name = "TestName";
            participantForEvent.Role = Role.Individual;
            participantForEvent.HearingRole = "TestHearingRole";

            var participantCount = conference.Participants.Count;

            var callbackEvent = new CallbackEvent
            {
                EventType = EventType.Joined,
                EventId = Guid.NewGuid().ToString(),
                ConferenceId = conference.Id,
                ParticipantAdded = participantForEvent,
                TimeStampUtc = DateTime.UtcNow
            };

            await _eventHandler.HandleAsync(callbackEvent);

            EventHubClientMock.Verify(
                x => x.ParticipantAddedMessage(conference.Id, It.Is<ParticipantResponse>(participant => 
                participant.Role == participantForEvent.Role 
                && participant.Name == participantForEvent.Name
                && participant.HearingRole == participantForEvent.HearingRole)), Times.Exactly(participantCount));
        }
    }
}
