using FluentAssertions;
using NUnit.Framework;
using VideoWeb.Mappings;
using VideoWeb.Services.Video;

namespace VideoWeb.UnitTests.Mappings
{
    public class RoomResponseMapperTest : BaseMockerSutTestSetup<RoomResponseMapper>
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
            var input = new RoomResponse { Label = labelText };
            _sut.Map(input).Label.Should().Be(labelText);
        }

        [TestCase(true)]
        [TestCase(false)]
        public void Should_set_locked(bool lockedState)
        {
            var input = new RoomResponse { Locked = lockedState };
            _sut.Map(input).Locked.Should().Be(lockedState);
        }

    }
}
