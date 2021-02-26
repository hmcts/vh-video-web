using FizzWare.NBuilder;
using FluentAssertions;
using NUnit.Framework;
using VideoWeb.Contract.Request;
using VideoWeb.Mappings;

namespace VideoWeb.UnitTests.Mappings.Requests
{
    public class UpdateParticipantRequestMapperTests : BaseMockerSutTestSetup<UpdateParticipantRequestMapper>
    {
        [Test]
        public void should_map_to_update_participant_request()
        {
            var request = Builder<UpdateParticipantDisplayNameRequest>.CreateNew()
                .Build();
            
            var result = _sut.Map(request);

            result.First_name.Should().Be(request.FirstName);
            result.Last_name.Should().Be(request.LastName);
            result.Fullname.Should().Be(request.Fullname);
            result.Display_name.Should().Be(request.DisplayName);
            result.Representee.Should().Be(request.Representee);
        }
    }
}
