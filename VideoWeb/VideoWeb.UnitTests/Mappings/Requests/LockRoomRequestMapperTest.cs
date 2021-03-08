using FizzWare.NBuilder;
using FluentAssertions;
using NUnit.Framework;
using System;
using VideoWeb.Contract.Request;
using VideoWeb.Mappings.Requests;

namespace VideoWeb.UnitTests.Mappings.Requests
{
   public class LockRoomRequestMappingTest : BaseMockerSutTestSetup<LockRoomRequestMapper>
    {
        [TestCase(true, "roomLabel")]
        [TestCase(true, "")]
        [TestCase(false, "roomLabel")]
        [TestCase(false, null)]
        public void should_map_to_lock_room_request(bool lockStatus, string label)
        {
            var request = Builder<LockConsultationRoomRequest>.CreateNew()
                .With(x => x.ConferenceId = Guid.NewGuid())
                .With(x => x.Lock = lockStatus)
                .With(x => x.RoomLabel = label)
                .Build();

            var result = _sut.Map(request);

            result.ConferenceId.Should().Be(request.ConferenceId);
            result.Lock.Should().Be(request.Lock);
            result.RoomLabel.Should().Equals(request.RoomLabel);
        }
    }
}

