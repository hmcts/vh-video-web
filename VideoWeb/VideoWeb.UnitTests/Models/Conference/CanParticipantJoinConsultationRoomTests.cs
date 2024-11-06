using System;
using System.Linq;
using FluentAssertions;
using NUnit.Framework;
using VideoWeb.Common.Models;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.Models.Conference;

public class CanParticipantJoinConsultationRoomTests
{
    [Test]
    public void ReturnsTrue_WhenParticipantCanJoin()
    {
        // Arrange
        var conference = new ConferenceCacheModelBuilder()
            .Build();
        
        var nonHostParticipants = conference.Participants.Where(x => !x.IsHost()).ToList();
        var participant = nonHostParticipants[0];
        
        var patInRoom = nonHostParticipants[1];
        var endpoint = conference.Endpoints[0];
        
        var roomLabel = "Room1";
        var consultationRoom = new ConsultationRoom { Label = roomLabel };
        conference.ConsultationRooms.Add(consultationRoom);
        patInRoom.CurrentRoom = consultationRoom;
        endpoint.CurrentRoom = consultationRoom;
        
        var quickLinkParticipant = new Participant()
        {
            Id = Guid.NewGuid(),
            ExternalReferenceId = null,
            Role = Role.QuickLinkParticipant,
            HearingRole = "Quick Link Participant",
            DisplayName = "QL 1",
            CurrentRoom = consultationRoom
        };
        conference.AddParticipant(quickLinkParticipant);

        // Act
        var result = conference.CanParticipantJoinConsultationRoom(roomLabel, participant.Id);

        // Assert
        result.Should().BeTrue();
    }

    [Test]
    public void ReturnsFalse_WhenParticipantCannotJoin()
    {
        // Arrange
        var conference = new ConferenceCacheModelBuilder()
            .Build();
        var nonHostParticipants = conference.Participants.Where(x => !x.IsHost()).ToList();
        var participant = nonHostParticipants[0];
        
        
        var patInRoom = nonHostParticipants[1];
        var endpoint = conference.Endpoints[0];
        
        participant.ProtectFrom.Add(endpoint.ExternalReferenceId);
        
        var roomLabel = "Room1";
        var consultationRoom = new ConsultationRoom { Label = roomLabel };
        conference.ConsultationRooms.Add(consultationRoom);
        patInRoom.CurrentRoom = consultationRoom;
        endpoint.CurrentRoom = consultationRoom;

        // Act
        var result = conference.CanParticipantJoinConsultationRoom(roomLabel, participant.Id);

        // Assert
        result.Should().BeFalse();
    }
}
