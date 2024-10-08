using FluentAssertions;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings;

namespace VideoWeb.UnitTests.Mappings;

public class ParticipantUserResponseMapperTests
{
    private LinkedParticipant linkedParticipant1;
    private LinkedParticipant linkedParticipant2;
    private List<LinkedParticipant> linkedParticipants;
    
    private LinkedParticipantResponse linkedParticipantResponse1;
    private LinkedParticipantResponse linkedParticipantResponse2;
    
    private RoomSummaryResponse roomSummaryResponse;
    private Guid participantId = Guid.NewGuid();
    
    [SetUp]
    public void Setup()
    {
        linkedParticipant1 = new LinkedParticipant() { LinkedId = Guid.NewGuid() };
        linkedParticipant2 = new LinkedParticipant() { LinkedId = Guid.NewGuid() };
        linkedParticipants = new List<LinkedParticipant>() { linkedParticipant1, linkedParticipant2 };
        linkedParticipantResponse1 = new LinkedParticipantResponse() { LinkedId = linkedParticipant1.LinkedId };
        linkedParticipantResponse2 = new LinkedParticipantResponse() { LinkedId = linkedParticipant2.LinkedId };
        roomSummaryResponse = new RoomSummaryResponse()
        {
            Id = "123123",
            Label = "RoomSummaryLabel",
            Locked = false
        };
    }
    
    [Test]
    public void Should_map_correctly()
    {
        var testParticipant = new Participant()
        {
            ContactEmail = "TestContactEmail",
            ContactTelephone = "TestContactTelephone",
            DisplayName = "TestDisplayName",
            FirstName = "TestFirstName",
            HearingRole = "TestHearingRole",
            LastName = "TestLastName",
            LinkedParticipants = linkedParticipants,
            ParticipantStatus = ParticipantStatus.Disconnected,
            RefId = Guid.NewGuid(),
            Representee = "TestRepresentee",
            Role = Role.JudicialOfficeHolder,
            Id = participantId,
            Username = "TestUsername",
            CurrentRoom = new ConsultationRoom
            {
                Label = "Room1",
                Locked = true
            },
            InterpreterRoom = new ConsultationRoom
            {
                Id = long.Parse(roomSummaryResponse.Id),
                Label = roomSummaryResponse.Label,
                Locked = roomSummaryResponse.Locked
            }
        };
        
        var mapped = ParticipantUserResponseMapper.Map(testParticipant);
        mapped.Should().NotBeNull();
        mapped.DisplayName.Should().Be(testParticipant.DisplayName);
        mapped.Status.Should().Be(testParticipant.ParticipantStatus);
        mapped.Role.Should().Be(testParticipant.Role);
        mapped.Id.Should().Be(testParticipant.Id);
        mapped.LinkedParticipants.Should().BeEquivalentTo(new List<LinkedParticipantResponse>
            { linkedParticipantResponse1, linkedParticipantResponse2 });
        mapped.InterpreterRoom.Should().BeEquivalentTo(roomSummaryResponse);
        mapped.CurrentRoom.Should().NotBeNull();
        mapped.CurrentRoom.Label.Should().Be(testParticipant.CurrentRoom.Label);
        mapped.CurrentRoom.Locked.Should().Be(testParticipant.CurrentRoom.Locked);
    }
}
