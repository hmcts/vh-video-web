using System;
using System.Threading.Tasks;
using FluentAssertions;
using NUnit.Framework;
using VideoWeb.Common.Models;
using VideoWeb.EventHub.Enums;
using VideoWeb.EventHub.Exceptions;
using VideoWeb.EventHub.Handlers;
using VideoWeb.EventHub.Models;

namespace VideoWeb.UnitTests.EventHandlers;

public class TelephoneTransferEventHandlerTests : EventHandlerTestBase
{
    [Test]
    public async Task should_update_telephone_participant_room()
    {
        var eventHandler = new TelephoneTransferEventHandler(EventHubContextMock.Object,
            ConferenceServiceMock.Object, LoggerMock.Object);
        
        var conference = TestConference;
        var telephoneId = Guid.NewGuid();
        conference.AddTelephoneParticipant(telephoneId, "Anonymous");
        
        var callbackEvent = new CallbackEvent
        {
            EventType = EventType.Transfer,
            EventId = Guid.NewGuid().ToString(),
            ConferenceId = conference.Id,
            ParticipantId = telephoneId,
            TransferFrom = RoomType.WaitingRoom.ToString(),
            TransferTo = RoomType.HearingRoom.ToString(),
            TimeStampUtc = DateTime.UtcNow,
            PhoneNumber = "Anonymous"
        };

        await eventHandler.HandleAsync(callbackEvent);
        var updatedParticipant = TestConference.TelephoneParticipants.Find(x => x.Id == telephoneId);
        updatedParticipant.Should().NotBeNull();
        updatedParticipant.Room.Should().Be(RoomType.HearingRoom);
    }

    [Test]
    public void should_throw_exception_if_telephone_participant_is_transferred_to_unsupported_room()
    {
        var eventHandler = new TelephoneTransferEventHandler(EventHubContextMock.Object,
            ConferenceServiceMock.Object, LoggerMock.Object);
        
        var conference = TestConference;
        var telephoneId = Guid.NewGuid();
        conference.AddTelephoneParticipant(telephoneId, "Anonymous");
        
        var callbackEvent = new CallbackEvent
        {
            EventType = EventType.Transfer,
            EventId = Guid.NewGuid().ToString(),
            ConferenceId = conference.Id,
            ParticipantId = telephoneId,
            TransferFrom = RoomType.WaitingRoom.ToString(),
            TransferTo = "ParticipantConsultationRoom1",
            TimeStampUtc = DateTime.UtcNow,
            PhoneNumber = "Anonymous"
        };

        var action = async () => await eventHandler.HandleAsync(callbackEvent);
        action.Should().ThrowAsync<RoomTransferException>();
    }
}
