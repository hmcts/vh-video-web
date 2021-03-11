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

            var result = _sut.Map(testVmr, participantId, false);
            result.PexipNode.Should().Be(testVmr.PexipNode);
            result.ParticipantJoinUri.Should().Be(testVmr.ParticipantJoinUri);
            result.DisplayName.Should().Be(testVmr.Label);
            result.TileDisplayName.Should().Be($"T201;Interpreter1;{participantId}");
        }
        
        [Test]
        public void should_map_witness_vmr_to_interpreter_rom()
        {
            var participantId = Guid.NewGuid();
            var testVmr = new SharedParticipantRoomResponse
            {
                Label = "Interpreter1",
                ParticipantJoinUri = "joidshfdsf",
                PexipNode = "sip.unit.test.com"
            };

            var result = _sut.Map(testVmr, participantId, true);
            result.PexipNode.Should().Be(testVmr.PexipNode);
            result.ParticipantJoinUri.Should().Be(testVmr.ParticipantJoinUri);
            result.DisplayName.Should().Be(testVmr.Label);
            result.TileDisplayName.Should().Be($"W201;Interpreter1;{participantId}");
        }
    }
}
