using System.Collections.Generic;
using BookingsApi.Contract.V2.Enums;
using BookingsApi.Contract.V2.Responses;
using FizzWare.NBuilder;
using FluentAssertions;
using NUnit.Framework;
using VideoWeb.Common.Caching;
using VideoApi.Contract.Responses;
using EndpointResponse = VideoApi.Contract.Responses.EndpointResponse;

namespace VideoWeb.UnitTests.Mappings;

public class EndpointCacheMapperTests
{
    [Test]
    public void should_map_endpoint_to_cache_model()
    {
        var ep = Builder<EndpointResponse>.CreateNew()
            .With(e => e.ParticipantsLinked = ["Rep1", "Rep2"])
            .With(e => e.CurrentRoom = Builder<RoomResponse>.CreateNew()
                .With(r => r.Id = 1)
                .Build())
            .Build();
        var epForHearing = new EndpointResponseV2
        {
            Id = ep.Id,
            DisplayName = ep.DisplayName,
            Sip = ep.SipAddress,
            Pin = ep.Pin,
            InterpreterLanguage = new InterpreterLanguagesResponse
            {
                Code = "spa",
                Value = "Spanish",
                Type = InterpreterType.Verbal
            }
        };
        var cachedModel = EndpointCacheMapper.MapEndpointToCacheModel(ep, epForHearing);
        
        cachedModel.Id.Should().Be(ep.Id);
        cachedModel.DisplayName.Should().Be(ep.DisplayName);
        cachedModel.EndpointStatus.ToString().Should().Be(ep.Status.ToString());
        cachedModel.ParticipantsLinked.Should().BeEquivalentTo(ep.ParticipantsLinked);
        cachedModel.CurrentRoom.Id.Should().Be(ep.CurrentRoom.Id);
        cachedModel.CurrentRoom.Label.Should().Be(ep.CurrentRoom.Label);
        cachedModel.CurrentRoom.Locked.Should().Be(ep.CurrentRoom.Locked);
    }
}
