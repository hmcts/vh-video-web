using System;
using System.Linq;
using System.Threading.Tasks;
using Moq;
using NUnit.Framework;
using VideoWeb.Common.Models;
using VideoWeb.EventHub.Handlers;
using VideoWeb.EventHub.Models;
using VideoApi.Contract.Responses;
using EventType = VideoWeb.EventHub.Enums.EventType;
using ParticipantState = VideoWeb.EventHub.Enums.ParticipantState;

namespace VideoWeb.UnitTests.EventHandlers
{
    public class JoinedEventHandlerTests : EventHandlerTestBase
    {
        private JoinedEventHandler _eventHandler;

        [Test]
        public async Task Should_send_available_message_to_participants_and_service_bus_when_participant_joins()
        {
            MemoryCache.Remove(TestConference.Id);
            var confDetail = CreateConferenceDetailsResponse();
            VideoApiClientMock.Setup(x => x.GetConferenceDetailsByIdAsync(TestConference.Id)).ReturnsAsync(confDetail);

            _eventHandler = new JoinedEventHandler(EventHubContextMock.Object, ConferenceCache, LoggerMock.Object,
                VideoApiClientMock.Object);

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
                    ParticipantState.Available), Times.Exactly(participantCount));
            
            VideoApiClientMock.Verify(x => x.GetConferenceDetailsByIdAsync(TestConference.Id), Times.Once);
        }

        private ConferenceDetailsResponse CreateConferenceDetailsResponse()
        {
            var pats = TestConference.Participants.Select(p => new ParticipantDetailsResponse
            {
                Id = p.Id,
                Username = p.Username,
                DisplayName = p.DisplayName,
            }).ToList();

            var conference = new ConferenceDetailsResponse
            {
                Id = TestConference.Id,
                HearingId = TestConference.HearingId,
                Participants = pats
            };
            return conference;
        }
    }
}
