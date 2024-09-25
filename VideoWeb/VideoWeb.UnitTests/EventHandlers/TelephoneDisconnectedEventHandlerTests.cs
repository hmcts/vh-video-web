using System;
using System.Threading.Tasks;
using FluentAssertions;
using NUnit.Framework;
using VideoWeb.EventHub.Enums;
using VideoWeb.EventHub.Handlers;
using VideoWeb.EventHub.Models;

namespace VideoWeb.UnitTests.EventHandlers;

public class TelephoneDisconnectedEventHandlerTests : EventHandlerTestBase
{
    [Test]
    public async Task should_remove_telephone_participant()
    {
        var eventHandler = new TelephoneDisconnectedEventHandler(EventHubContextMock.Object,
            ConferenceServiceMock.Object, LoggerMock.Object);
        
        var conference = TestConference;
        var telephoneId = Guid.NewGuid();
        conference.AddTelephoneParticipant(telephoneId, "Anonymous");
        
        var callbackEvent = new CallbackEvent
        {
            EventType = EventType.TelephoneDisconnected,
            EventId = Guid.NewGuid().ToString(),
            ConferenceId = conference.Id,
            ParticipantId = telephoneId,
            TransferFrom = null,
            TransferTo = null,
            TimeStampUtc = DateTime.UtcNow,
            PhoneNumber = "Anonymous",
        };

        await eventHandler.HandleAsync(callbackEvent);
        var removedParticipant = TestConference.TelephoneParticipants.Find(x => x.Id == telephoneId);
        removedParticipant.Should().BeNull();
    }
}
