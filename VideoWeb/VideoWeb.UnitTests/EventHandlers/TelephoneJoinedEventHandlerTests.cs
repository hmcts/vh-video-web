using System;
using System.Threading.Tasks;
using FluentAssertions;
using NUnit.Framework;
using VideoWeb.Common.Models;
using VideoWeb.EventHub.Enums;
using VideoWeb.EventHub.Handlers;
using VideoWeb.EventHub.Models;

namespace VideoWeb.UnitTests.EventHandlers;

public class TelephoneJoinedEventHandlerTests : EventHandlerTestBase
{
    [Test]
    public async Task should_add_telephone_participant_to_cache()
    {
        var eventHandler = new TelephoneJoinedEventHandler(EventHubContextMock.Object, ConferenceServiceMock.Object,
            LoggerMock.Object);
        var conference = TestConference;

        var telephoneId = Guid.NewGuid();

        var callbackEvent = new CallbackEvent
        {
            EventType = EventType.TelephoneJoined,
            EventId = Guid.NewGuid().ToString(),
            ConferenceId = conference.Id,
            ParticipantId = telephoneId,
            TransferFrom = null,
            TransferTo = null,
            TimeStampUtc = DateTime.UtcNow,
            PhoneNumber = "Anonymous",
        };

        await eventHandler.HandleAsync(callbackEvent);
        var addedParticipant = TestConference.TelephoneParticipants.Find(x => x.Id == telephoneId);
        addedParticipant.Should().NotBeNull();
        addedParticipant.PhoneNumber.Should().Be(callbackEvent.PhoneNumber);
        addedParticipant.Connected.Should().BeTrue();
        addedParticipant.Room.Should().Be(RoomType.WaitingRoom);
    }
}
