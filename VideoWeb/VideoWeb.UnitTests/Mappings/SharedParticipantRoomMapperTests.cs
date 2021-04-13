using System;
using FluentAssertions;
using NUnit.Framework;
using VideoApi.Contract.Responses;
using VideoWeb.Common.Models;
using VideoWeb.Mappings;

namespace VideoWeb.UnitTests.Mappings
{
    public class SharedParticipantRoomMapperTests : BaseMockerSutTestSetup<SharedParticipantRoomMapper>
    {
        [Test]
        public void should_map_vmr_to_interpreter_room()
        {
            var participant = new Participant
            {
                Id = Guid.NewGuid(),
                DisplayName = "Interpreter Doe"
            };
            var testVmr = new SharedParticipantRoomResponse
            {
                Label = "Interpreter1",
                ParticipantJoinUri = "joidshfdsf",
                PexipNode = "sip.unit.test.com"
            };

            var result = _sut.Map(testVmr, participant, false);
            result.PexipNode.Should().Be(testVmr.PexipNode);
            result.ParticipantJoinUri.Should().Be(testVmr.ParticipantJoinUri);
            result.DisplayName.Should().Be(testVmr.Label);
            result.TileDisplayName.Should().EndWith($"{participant.DisplayName};{participant.Id}");
        }

        [Test]
        public void should_have_unique_tile_positions()
        {
            var participantA = new Participant
            {
                Id = Guid.NewGuid(),
                DisplayName = "Interpreter Doe"
            };

            var participantB = new Participant
            {
                Id = Guid.NewGuid(),
                DisplayName = "Interpretee Doe"
            };
            var testVmr = new SharedParticipantRoomResponse
            {
                Label = "Interpreter1",
                ParticipantJoinUri = "joidshfdsf",
                PexipNode = "sip.unit.test.com"
            };

            var resultA = _sut.Map(testVmr, participantA, false);
            var resultB = _sut.Map(testVmr, participantB, false);

            resultA.TileDisplayName.Should().NotMatch(resultB.TileDisplayName);
        }

        [Test]
        public void should_map_witness_vmr_to_interpreter_room()
        {
            var participant = new Participant
            {
                Id = Guid.NewGuid(),
                DisplayName = "Witness Doe"
            };
            var testVmr = new SharedParticipantRoomResponse
            {
                Label = "Interpreter1",
                ParticipantJoinUri = "joidshfdsf",
                PexipNode = "sip.unit.test.com"
            };

            var result = _sut.Map(testVmr, participant, true);
            result.PexipNode.Should().Be(testVmr.PexipNode);
            result.ParticipantJoinUri.Should().Be(testVmr.ParticipantJoinUri);
            result.DisplayName.Should().Be(testVmr.Label);
            result.TileDisplayName.Should().EndWith($"{participant.DisplayName};{participant.Id}");
            result.TileDisplayName.Should().StartWith("WITNESS");
        }

        [Test]
        public void should_map_panel_member_vmr_to_shared_room()
        {
            var participant = new Participant
            {
                Id = Guid.NewGuid(),
                DisplayName = "Panel Doe"
            };
            var testVmr = new SharedParticipantRoomResponse
            {
                Label = "PanelMember1",
                ParticipantJoinUri = "joidshfdsf",
                PexipNode = "sip.unit.test.com"
            };

            var result = _sut.Map(testVmr, participant, false);
            result.PexipNode.Should().Be(testVmr.PexipNode);
            result.ParticipantJoinUri.Should().Be(testVmr.ParticipantJoinUri);
            result.DisplayName.Should().Be(testVmr.Label);
            result.TileDisplayName.Should().EndWith($"{participant.DisplayName};{participant.Id}");
            result.TileDisplayName.Should().StartWith("CIVILIAN");
        }
    }
}
