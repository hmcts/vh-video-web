using System;
using FluentAssertions;
using NUnit.Framework;
using VideoWeb.Mappings;
using VideoWeb.Services.Video;

namespace VideoWeb.UnitTests.Mappings
{
    public class InterpreterRoomMapperTests : BaseMockerSutTestSetup<InterpreterRoomMapper>
    {
        [Test]
        public void should_map_vmr_to_interpreter_rom()
        {
            var participantId = Guid.NewGuid();
            var testVmr = new InterpreterRoomResponse
            {
                Label = "Interpreter1",
                Participant_join_uri = "joidshfdsf",
                Pexip_node = "sip.unit.test.com"
            };

            var result = _sut.Map(testVmr, participantId);
            result.PexipNode.Should().Be(testVmr.Pexip_node);
            result.ParticipantJoinUri.Should().Be(testVmr.Participant_join_uri);
            result.DisplayName.Should().Be(testVmr.Label);
            result.TileDisplayName.Should().Be($"I1;Interpreter1;{participantId}");
        }
    }
}
