using FluentAssertions;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using System.Text;
using VideoWeb.Common.Models;
using VideoWeb.Mappings;

namespace VideoWeb.UnitTests.Mappings
{
    class CivilianRoomToRoomSummaryResponseMapperTests : BaseMockerSutTestSetup<CivilianRoomToRoomSummaryResponseMapper>
    {
        [Test]
        public void When_room_is_null_Should_return_null()
        {
            var result = _sut.Map(null);
            result.Should().BeNull();
        }

        public void Should_map_correctly()
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
            var result = _sut.Map(room);
            result.Id.Should().Be(room.Id.ToString());
            result.Label.Should().Be(room.RoomLabel);
        }
    }
}
