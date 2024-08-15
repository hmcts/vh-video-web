using System;
using System.Collections.Generic;
using FluentAssertions;
using NUnit.Framework;
using VideoWeb.Mappings;
using VideoApi.Contract.Responses;
using VideoWeb.Common.Models;

namespace VideoWeb.UnitTests.Mappings;

public class RoomSummaryResponseMapperTest
{
    [TestCase("label")]
    [TestCase("")]
    [TestCase(null)]
    public void Should_map_from_video_api_contract(string labelText)
    {
        var input = new RoomResponse() {Id = 1,Label = labelText, Locked = true};
        var result = RoomSummaryResponseMapper.Map(input);
        result.Label.Should().Be(labelText);
        result.Locked.Should().Be(true);
        result.Id.Should().Be("1");
    }
    
    [TestCase("label")]
    [TestCase("")]
    [TestCase(null)]
    public void Should_map_from_ConsultationRoom(string labelText)
    {
        var input = new ConsultationRoom() {Id = 1,Label = labelText, Locked = true};
        var result = RoomSummaryResponseMapper.Map(input);
        result.Label.Should().Be(labelText);
        result.Locked.Should().Be(true);
        result.Id.Should().Be("1");
    }
    
    [Test]
    public void Should_map_from_CivilianRoom()
    {
        var room = new CivilianRoom()
        {
            Id = 12345,
            Participants = new List<Guid>
            {
                Guid.NewGuid()
            },
            RoomLabel = "RoomLabel",
        };
        var result = RoomSummaryResponseMapper.Map(room);
        result.Id.Should().Be(room.Id.ToString());
        result.Label.Should().Be(room.RoomLabel);
    }
}
