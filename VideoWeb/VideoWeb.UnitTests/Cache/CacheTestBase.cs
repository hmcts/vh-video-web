using System;
using System.Linq;
using System.Threading.Tasks;
using BookingsApi.Contract.V2.Responses;
using FizzWare.NBuilder;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using VideoApi.Contract.Responses;

namespace VideoWeb.UnitTests.Cache;

public abstract class CacheTestBase
{
    protected Func<Task<(ConferenceDetailsResponse, HearingDetailsResponseV2)>> DummyInput;
    
    protected CacheTestBase()
    {
        DummyInput = It.IsAny<Func<Task<(ConferenceDetailsResponse, HearingDetailsResponseV2)>>>();
    }
    
    protected static ConferenceDetailsResponse CreateConferenceResponse()
    {
        var participants = Builder<ParticipantResponse>.CreateListOfSize(2).Build().ToList();
        var endpoints = Builder<EndpointResponse>.CreateListOfSize(2).Build().ToList();
        var conference = Builder<ConferenceDetailsResponse>.CreateNew()
            .With(x => x.Participants = participants)
            .With(x => x.Endpoints = endpoints)
            .Build();
        return conference;
    }
    
    protected static HearingDetailsResponseV2 CreateHearingResponse(ConferenceDetailsResponse conference)
    {
        var hearingParticipants = conference.Participants.Select(x => new ParticipantResponseV2
        {
            Id = x.RefId,
            Username = x.Username,
            DisplayName = x.DisplayName,
            FirstName = "John",
            LastName = "Doe",
            UserRoleName = x.UserRole.ToString(),
        }).ToList();
        
        var endpoints = Builder<EndpointResponseV2>.CreateListOfSize(2).Build().ToList();
        
        var hearing = Builder<HearingDetailsResponseV2>.CreateNew()
            .With(x => x.Id == conference.HearingId)
            .With(x => x.Participants = hearingParticipants)
            .With(x => x.Endpoints = endpoints)
            .With(x => x.Cases = Builder<CaseResponseV2>.CreateListOfSize(1).Build().ToList())
            .Build();
        return hearing;
    }
    
    protected static IMemoryCache GetCache()
    {
        var services = new ServiceCollection();
        services.AddMemoryCache();
        var serviceProvider = services.BuildServiceProvider();
        
        var memoryCache = serviceProvider.GetService<IMemoryCache>();
        return memoryCache;
    }
}
