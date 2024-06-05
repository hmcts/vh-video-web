using FluentAssertions;
using NUnit.Framework;
using VideoWeb.Mappings;
using VideoApi.Contract.Responses;
using VideoWeb.Common.Models;

namespace VideoWeb.UnitTests.Mappings
{
    public class RoomSummaryResponseMapperTest : BaseMockerSutTestSetup<RoomSummaryResponseMapper>
    {
        [Test]
        public void Should_return_null_if_input_is_null()
        {
            _sut.Map(null).Should().BeNull();
        }

        [TestCase("label")]
        [TestCase("")]
        [TestCase(null)]
        public void Should_set_label(string labelText)
        {
            var input = new ParticipantMeetingRoom {Id = 1,Label = labelText };
            var result = _sut.Map(input);
            result.Label.Should().Be(labelText);
            result.Id.Should().Be("1");
        }

        [TestCase(true)]
        [TestCase(false)]
        public void Should_set_locked(bool lockedState)
        {
            var input = new ParticipantMeetingRoom() { Locked = lockedState };
            _sut.Map(input).Locked.Should().Be(lockedState);
        }

    }
}
