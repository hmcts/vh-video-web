using Moq;
using NUnit.Framework;
using FluentAssertions;
using System;
using System.Linq;
using System.Threading.Tasks;
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
            _eventHandler = new ParticipantsUpdatedEventHandler(EventHubContextMock.Object, ConferenceServiceMock.Object, LoggerMock.Object);

            var conference = TestConference;

            var participantCount = conference.Participants.Count;
            var participants = conference.Participants
                .Select(p => new ParticipantResponse
                {
                    UserName = p.Username
                })
                .ToList();

            var callbackEvent = new CallbackEvent
            {
                EventType = EventType.ParticipantsUpdated,
                EventId = Guid.NewGuid().ToString(),
                ConferenceId = conference.Id,
                Participants = participants,
                ParticipantsToNotify = participants,
                TimeStampUtc = DateTime.UtcNow
            };

            await _eventHandler.HandleAsync(callbackEvent);

            const int vhoCount = 1;
            const int staffMemberCount = 1;
            EventHubClientMock.Verify(
                x => x.ParticipantsUpdatedMessage(conference.Id, participants), Times.Exactly(participantCount + vhoCount + staffMemberCount));
            TestConference.Participants.Should().HaveCount(participantCount);
        }
    }
}
