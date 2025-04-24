using System;
using System.Threading.Tasks;
using FluentAssertions;
using Moq;
using NUnit.Framework;
using VideoWeb.EventHub.Enums;
using VideoWeb.EventHub.Handlers;
using VideoWeb.EventHub.Models;

namespace VideoWeb.UnitTests.EventHandlers
{
    public class CountdownFinishedEventHandlerTests : EventHandlerTestBase
    {
        private CountdownFinishedEventHandler _eventHandler;
        
        [Test]
        public async Task Should_send_do_nothing_when_countdown_has_finished()
        {
            _eventHandler = new CountdownFinishedEventHandler(EventHubContextMock.Object, ConferenceServiceMock.Object, LoggerMock.Object);

            var conference = TestConference;
            conference.CountdownComplete = false;
            var participantCount = conference.Participants.Count + 1; // plus one for admin
            var callbackEvent = new CallbackEvent
            {
                EventType = EventType.CountdownFinished,
                EventId = Guid.NewGuid().ToString(),
                ConferenceId = conference.Id,
                TimeStampUtc = DateTime.UtcNow
            };

            await _eventHandler.HandleAsync(callbackEvent);

            // Verify messages sent to event hub clients
            EventHubClientMock.Verify(x => x.CountdownFinished(conference.Id),
                Times.Exactly(participantCount));

            conference.CountdownComplete.Should().BeTrue();
        }
    }
}
