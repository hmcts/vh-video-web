using System;
using System.Threading.Tasks;
using FluentAssertions;
using Moq;
using NUnit.Framework;
using VideoWeb.Common.Models;
using VideoWeb.EventHub.Handlers;
using VideoWeb.EventHub.Models;
using EventType = VideoWeb.EventHub.Enums.EventType;

namespace VideoWeb.UnitTests.EventHandlers
{
    public class StartEventHandlerTests : EventHandlerTestBase
    {
        private StartEventHandler _eventHandler;

        [Test]
        public async Task Should_send_messages_to_participants_on_start()
        {
            _eventHandler = new StartEventHandler(EventHubContextMock.Object, ConferenceServiceMock.Object, LoggerMock.Object);

            var conference = TestConference;
            var participantCount = conference.Participants.Count + 1; // plus one for admin
            var callbackEvent = new CallbackEvent
            {
                EventType = EventType.Start,
                EventId = Guid.NewGuid().ToString(),
                ConferenceId = conference.Id,
                TimeStampUtc = DateTime.UtcNow
            };

            await _eventHandler.HandleAsync(callbackEvent);

            // Verify messages sent to event hub clients
            EventHubClientMock.Verify(x => x.ConferenceStatusMessage(conference.Id, ConferenceStatus.InSession),
                Times.Exactly(participantCount));
            TestConference.CurrentStatus.Should().Be(ConferenceStatus.InSession);
        }
        
        [Test]
        public async Task Should_still_process_when_last_time_stamp_is_newer_than_event_timestamp()
        {
            _eventHandler = new StartEventHandler(EventHubContextMock.Object, ConferenceServiceMock.Object, LoggerMock.Object);

            var conference = TestConference;
            conference.LastEventTime = DateTime.UtcNow.AddSeconds(1);
            var participantCount = conference.Participants.Count + 1; // plus one for admin
            var callbackEvent = new CallbackEvent
            {
                EventType = EventType.Start,
                EventId = Guid.NewGuid().ToString(),
                ConferenceId = conference.Id,
                TimeStampUtc = DateTime.UtcNow.AddSeconds(-1)
            };

            await _eventHandler.HandleAsync(callbackEvent);

            // Verify messages sent to event hub clients
            EventHubClientMock.Verify(x => x.ConferenceStatusMessage(conference.Id, ConferenceStatus.InSession),
                Times.Exactly(participantCount));
            TestConference.CurrentStatus.Should().Be(ConferenceStatus.InSession);
        }
    }
}
