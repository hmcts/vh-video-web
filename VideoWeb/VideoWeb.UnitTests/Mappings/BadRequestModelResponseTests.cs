using System.Collections.Generic;
using FluentAssertions;
using NUnit.Framework;
using VideoWeb.Mappings;

namespace VideoWeb.UnitTests.Mappings
{
    public class BadRequestModelResponseTests
    {
        [Test]
        public void should_map_dictionary_to_response()
        {
            var title = "ConsultationRoom";
            var errorArray = new[] {"No consultation room available"};
            var errors = new Dictionary<string, string[]> {{title, errorArray}};

            var result = BadRequestResponseMapper.MapToResponse(errors);

            result.Errors[0].Title.Should().BeEquivalentTo(title);
            result.Errors[0].Errors.Should().BeEquivalentTo(errorArray);
        }
    }
}
