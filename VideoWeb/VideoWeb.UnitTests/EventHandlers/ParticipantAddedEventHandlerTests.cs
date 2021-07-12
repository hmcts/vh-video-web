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
        private ParticipantsUpdatedEventHandler _eventHandler;

        [Test]
        public async Task Should_send_participants_updated_message_to_participants()
        {
            _eventHandler = new ParticipantsUpdatedEventHandler(EventHubContextMock.Object, ConferenceCache,
                LoggerMock.Object, VideoApiClientMock.Object);

            var conference = TestConference;

            var participantCount = conference.Participants.Count;
            var participants = new List<ParticipantResponse>() {
                new ParticipantResponse(),
                new ParticipantResponse(),
                new ParticipantResponse()
            };

            var callbackEvent = new CallbackEvent
            {
                EventType = EventType.ParticipantsUpdated,
                EventId = Guid.NewGuid().ToString(),
                ConferenceId = conference.Id,
                Participants = participants,
                TimeStampUtc = DateTime.UtcNow
            };

            await _eventHandler.HandleAsync(callbackEvent);

            EventHubClientMock.Verify(
                x => x.ParticipantsUpdatedMessage(conference.Id, participants), Times.Exactly(participantCount + 1));
        }
    }
}
