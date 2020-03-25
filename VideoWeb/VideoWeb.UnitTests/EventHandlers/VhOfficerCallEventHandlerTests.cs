using System;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using Moq;
using NUnit.Framework;
using VideoWeb.Common.Models;
using VideoWeb.EventHub.Enums;
using VideoWeb.EventHub.Handlers;
using VideoWeb.EventHub.Models;

namespace VideoWeb.UnitTests.EventHandlers
{
    public class VhOfficerCallEventHandlerTests : EventHandlerTestBase
    {
        private VhOfficerCallEventHandler _eventHandler;

        [TestCase(null)]
        [TestCase(RoomType.AdminRoom)]
        [TestCase(RoomType.HearingRoom)]
        [TestCase(RoomType.WaitingRoom)]
        public void Should_throw_exception_when_transfer_to_is_not_a_consultation_room(RoomType? transferTo)
        {
            _eventHandler = new VhOfficerCallEventHandler(EventHubContextMock.Object, ConferenceCache, LoggerMock.Object);
            
            var conference = TestConference;
            var participantForEvent = conference.Participants.First(x => x.Role == UserRole.Individual);

            
            var callbackEvent = new CallbackEvent
            {
                EventType = EventType.Transfer,
                EventId = Guid.NewGuid().ToString(),
                ConferenceId = conference.Id,
                ParticipantId = participantForEvent.Id,
                TransferTo = transferTo,
                TimeStampUtc = DateTime.UtcNow
            };

            var exception = Assert.ThrowsAsync<ArgumentException>(async () => await _eventHandler.HandleAsync(callbackEvent));
            exception.Message.Should().Be("No consultation room provided");
        }

        [TestCase(RoomType.ConsultationRoom1)]
        [TestCase(RoomType.ConsultationRoom2)]
        public async Task Should_raise_admin_consultation_message(RoomType? transferTo)
        {
            _eventHandler = new VhOfficerCallEventHandler(EventHubContextMock.Object, ConferenceCache, LoggerMock.Object);
            
            var conference = TestConference;
            var participantForEvent = conference.Participants.First(x => x.Role == UserRole.Individual);

            
            var callbackEvent = new CallbackEvent
            {
                EventType = EventType.Transfer,
                EventId = Guid.NewGuid().ToString(),
                ConferenceId = conference.Id,
                ParticipantId = participantForEvent.Id,
                TransferTo = transferTo,
                TimeStampUtc = DateTime.UtcNow
            };

            await _eventHandler.HandleAsync(callbackEvent);

            EventHubClientMock.Verify(x =>
                    x.AdminConsultationMessage(conference.Id, transferTo.Value,
                        participantForEvent.Username.ToLowerInvariant(), null),
                Times.Once);
        }
    }
}
