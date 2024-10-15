using System;
using System.Linq;
using FluentAssertions;
using NUnit.Framework;
using VideoWeb.Common.Models;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.Models.Conference;

public class CanEndpointJoinConsultationRoomTests
{
    [Test]
    public void ReturnsTrue_WhenEndpointCanJoin()
    {
        // Arrange
        var conference = new ConferenceCacheModelBuilder()
            .Build();
        var nonHostParticipants = conference.Participants.Where(x => !x.IsHost()).ToList();
        var endpoint = conference.Endpoints[0];
        
        var patInRoom = nonHostParticipants[1];
        var endpointInRoom = conference.Endpoints[1];
        
        var roomLabel = "Room1";
        var consultationRoom = new ConsultationRoom { Label = roomLabel };
        conference.ConsultationRooms.Add(consultationRoom);
        patInRoom.CurrentRoom = consultationRoom;
        endpointInRoom.CurrentRoom = consultationRoom;

        // Act
        var result = conference.CanEndpointJoinConsultationRoom(roomLabel, endpoint.Id);

        // Assert
        result.Should().BeTrue();
    }

    [Test]
    public void ReturnFalse_WhenEndpointCannotJoin()
    {
        // Arrange
        var conference = new ConferenceCacheModelBuilder()
            .Build();
        var nonHostParticipants = conference.Participants.Where(x => !x.IsHost()).ToList();
        
        var endpoint = conference.Endpoints[0];
        
        var patInRoom = nonHostParticipants[1];
        var endpointInRoom = conference.Endpoints[1];
        
        patInRoom.ProtectFrom.Add(endpointInRoom.ExternalReferenceId);
        
        var roomLabel = "Room1";
        var consultationRoom = new ConsultationRoom { Label = roomLabel };
        conference.ConsultationRooms.Add(consultationRoom);
        patInRoom.CurrentRoom = consultationRoom;
        endpointInRoom.CurrentRoom = consultationRoom;

        // Act
        var result = conference.CanEndpointJoinConsultationRoom(roomLabel, endpoint.Id);

        // Assert
        result.Should().BeFalse();
    }
}
