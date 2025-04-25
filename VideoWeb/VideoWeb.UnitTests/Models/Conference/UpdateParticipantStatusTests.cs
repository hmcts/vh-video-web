using System;
using FluentAssertions;
using NUnit.Framework;
using VideoWeb.Common.Models;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.Models.Conference;

public class UpdateParticipantStatusTests
{
    [Test]
    public void should_update_participant_status()
    {
        // Arrange
        var conference = new ConferenceCacheModelBuilder()
            .Build();
        var participant = conference.Participants.Find(x => !x.IsHost());
        participant.ParticipantStatus = ParticipantStatus.Disconnected;
        var eventTimeStamp = DateTime.UtcNow;
        
        // Act
        conference.UpdateParticipantStatus(participant, ParticipantStatus.Available, eventTimeStamp);
        
        // Assert
        participant.ParticipantStatus.Should().Be(ParticipantStatus.Available);
        participant.LastEventTime.Should().Be(eventTimeStamp);
    }
    
    [Test(Description = "Refreshing in a consultation room should set the room to null when a disconnect event is sent")]
    public void should_update_participant_status_and_reset_room_if_disconnected()
    {
        // Arrange
        var conference = new ConferenceCacheModelBuilder()
            .Build();
        var participant = conference.Participants.Find(x => !x.IsHost());
        participant.ParticipantStatus = ParticipantStatus.InConsultation;
        var eventTimeStamp = DateTime.UtcNow;
        participant.CurrentRoom = new ConsultationRoom()
        {
            Label = "Room1",
            Locked = true,
            Id = 1
        };
        
        // Act
        conference.UpdateParticipantStatus(participant, ParticipantStatus.Disconnected, eventTimeStamp);
        
        // Assert
        participant.ParticipantStatus.Should().Be(ParticipantStatus.Disconnected);
        participant.CurrentRoom.Should().BeNull();
        participant.LastEventTime.Should().Be(eventTimeStamp);
    }
}
