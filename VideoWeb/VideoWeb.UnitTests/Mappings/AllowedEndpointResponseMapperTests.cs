using FluentAssertions;
using NUnit.Framework;
using System;
using System.Collections.Generic;
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
            var endpoint = new EndpointDto 
            { 
                EndpointParticipants = [new() { ParticipantUsername = defenceAdvocateUsername }],
                Id = Guid.NewGuid(),
                DisplayName = displayName 
            };

            // Act
            var result = _sut.Map(endpoint);

            // Assert
            result.Should().NotBeNull();
            result.DisplayName.Should().Be(displayName);
            result.EndpointParticipants[0].ParticipantUsername.Should().Be(defenceAdvocateUsername);
            result.Id.Should().Be(endpoint.Id);
        }
    }
}
