using BookingsApi.Contract.V2.Responses;
using FluentAssertions;
using NUnit.Framework;
using VideoApi.Contract.Enums;
using VideoWeb.Mappings;
using VideoWeb.UnitTests.Builders;
using VHEndpointStatus = VideoWeb.Common.Models.EndpointStatus;

namespace VideoWeb.UnitTests.Mappings
{
    public class EndpointsMapperTest : BaseMockerSutTestSetup<EndpointsMapper>
    {
        [TestCase(EndpointState.Connected, VHEndpointStatus.Connected)]
        [TestCase(EndpointState.Disconnected, VHEndpointStatus.Disconnected)]
        [TestCase(EndpointState.InConsultation, VHEndpointStatus.InConsultation)]
        [TestCase(EndpointState.NotYetJoined, VHEndpointStatus.NotYetJoined)]
        public void Should_map_user_response_to_court_rooms_account(EndpointState apiState, VHEndpointStatus expected)
        {            
            var defenceAdvocate = new EndpointParticipantResponse
            {
                ParticipantUsername = "DefenceAdvocate"
            };
            var endpointBuilder = new EndpointsResponseBuilder();
            var endpoint = endpointBuilder.WithStatus(apiState).Build();
            var endpointDetails = endpointBuilder.WithLinkedParticipant(defenceAdvocate).BuildEndpointDetailsResponse();
            var result = _sut.Map(endpoint, endpointDetails.EndpointParticipants);
            
            result.Should().NotBeNull();
            result.DisplayName.Should().Be(endpoint.DisplayName);
            result.Id.Should().Be(endpoint.Id);
            result.EndpointStatus.ToString().Should().Be(endpoint.Status.ToString());
            result.EndpointParticipants.Should().Contain(e => e.ParticipantUsername == defenceAdvocate.ParticipantUsername);
            result.DisplayName.Should().Be(endpoint.DisplayName);
        }
    }
}
