using FluentAssertions;
using NUnit.Framework;
using System;
using VideoWeb.Common.Models;
using VideoWeb.Mappings;

namespace VideoWeb.UnitTests.Mappings
{
    public class AllowedEndpointResponseMapperTests : BaseMockerSutTestSetup<AllowedEndpointResponseMapper>
    {
        [TestCase("test@hmcts.net", "displayName")]
        [TestCase(null, null)]
        [TestCase("", "")]
        public void Should_map_endpoint_to_allowed_endpoint_response(string defenceAdvocateUsername, string displayName)
        {
            // Arrange
            var endpoint = new Endpoint { DefenceAdvocateUsername = defenceAdvocateUsername, Id = Guid.NewGuid(), DisplayName = displayName };

            // Act
            var result = _sut.Map(endpoint);

            // Assert
            result.Should().NotBeNull();
            result.DisplayName.Should().Be(defenceAdvocateUsername);
            result.DefenceAdvocateUsername.Should().Be(displayName);
            result.Id.Should().Be(endpoint.Id);
        }
    }
}
