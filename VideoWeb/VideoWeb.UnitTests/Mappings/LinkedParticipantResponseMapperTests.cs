using System;
using FluentAssertions;
using NUnit.Framework;
using VideoApi.Contract.Enums;
using VideoApi.Contract.Responses;
using VideoWeb.Common.Models;
using VideoWeb.Mappings;

namespace VideoWeb.UnitTests.Mappings;

public class LinkedParticipantResponseMapperTests
{
    [Test]
    public void Should_map_all_properties()
    {
        var linkedParticipant = new LinkedParticipantResponse
        {
            LinkedId = Guid.NewGuid(),
            Type = LinkedParticipantType.Interpreter
        };
        
        var response = LinkedParticipantResponseMapper.Map(linkedParticipant);
        
        response.LinkedId.Should().Be(linkedParticipant.LinkedId);
        response.LinkType.ToString().Should().Be(linkedParticipant.Type.ToString());
    }
    
    [Test]
    public void Should_map_correctly_from_dto()
    {
        var testLinkedParticipant = new LinkedParticipant()
        {
            LinkedId = Guid.NewGuid(),
            LinkType = LinkType.Interpreter
        };
        
        var mapped = LinkedParticipantResponseMapper.Map(testLinkedParticipant);
        
        mapped.LinkedId.Should().Be(testLinkedParticipant.LinkedId);
        mapped.LinkType.Should().Be(testLinkedParticipant.LinkType);
    }
}
