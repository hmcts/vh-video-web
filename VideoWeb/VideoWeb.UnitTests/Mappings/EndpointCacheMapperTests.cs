using BookingsApi.Contract.V2.Enums;
using BookingsApi.Contract.V2.Responses;
using FizzWare.NBuilder;
using FluentAssertions;
using NUnit.Framework;
using VideoWeb.Common.Caching;
using VideoApi.Contract.Responses;
using VideoWeb.Common.Models;

namespace VideoWeb.UnitTests.Mappings
{
    public class EndpointCacheMapperTests
    {
        [Test]
        public void should_map_endpoint_to_cache_model()
        {
            var ep = Builder<EndpointResponse>.CreateNew().Build();
            var cachedModel = EndpointCacheMapper.MapEndpointToCacheModel(ep);

            cachedModel.Id.Should().Be(ep.Id);
            cachedModel.DisplayName.Should().Be(ep.DisplayName);
            cachedModel.EndpointStatus.ToString().Should().Be(ep.Status.ToString());
        }

        [Test]
        public void should_map_endpoint_participants_to_cache_model()
        {

            var participants = Builder<Participant>.CreateListOfSize(1).Build();
            var ep = new EndpointParticipantResponse
            {
                ParticipantId = participants[0].RefId,
                ParticipantUsername = "username",
                LinkedParticipantType = LinkedParticipantTypeV2.DefenceAdvocate
            };

            var cachedModel = EndpointParticipantCacheMapper.MapEndpointParticipantToCacheModel(ep, participants);
           
            cachedModel.ParticipantId.Should().Be(participants[0].Id);
            cachedModel.ParticipantRefId.Should().Be(ep.ParticipantId);
            cachedModel.ParticipantUsername.Should().Be(participants[0].Username);
            cachedModel.LinkedParticipantType.ToString().Should().Be(ep.LinkedParticipantType.ToString());
        }

    }
}
