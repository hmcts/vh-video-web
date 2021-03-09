using System;
using FluentAssertions;
using NUnit.Framework;
using VideoApi.Contract.Responses;
using VideoWeb.Mappings;

namespace VideoWeb.UnitTests.Mappings
{
    public class SharedParticipantRoomMapperTests : BaseMockerSutTestSetup<SharedParticipantRoomMapper>
    {
        [Test]
        public void should_map_vmr_to_interpreter_rom()
        {
            var participantId = Guid.NewGuid();
            var testVmr = new SharedParticipantRoomResponse
            {
                Label = "Interpreter1",
                ParticipantJoinUri = "joidshfdsf",
                PexipNode = "sip.unit.test.com"
            };

            var result = _sut.Map(testVmr, participantId);
            result.PexipNode.Should().Be(testVmr.PexipNode);
            result.ParticipantJoinUri.Should().Be(testVmr.ParticipantJoinUri);
            result.DisplayName.Should().Be(testVmr.Label);
            result.TileDisplayName.Should().Be($"I1;Interpreter1;{participantId}");
        }
    }
}
