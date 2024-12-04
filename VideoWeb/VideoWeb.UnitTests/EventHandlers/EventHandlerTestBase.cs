using System;
using System.Collections.Generic;
using System.Threading;
using FizzWare.NBuilder;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using VideoWeb.Common.Models;
using VideoWeb.EventHub.Handlers.Core;
using VideoWeb.EventHub.Hub;
using VideoWeb.Common;
using VideoWeb.UnitTests.Builders;
using EventComponentHelper = VideoWeb.UnitTests.Builders.EventComponentHelper;

namespace VideoWeb.UnitTests.EventHandlers;

public abstract class EventHandlerTestBase
{
    protected List<IEventHandler> EventHandlersList { get; private set; }
    protected Mock<IEventHubClient> EventHubClientMock { get; private set; }
    protected Mock<IHubContext<EventHub.Hub.EventHub, IEventHubClient>> EventHubContextMock { get; private set; }
    protected IMemoryCache MemoryCache { get; set; }
    protected Mock<IConferenceService> ConferenceServiceMock { get; private set; }
    protected Mock<ILogger<EventHandlerBase>> LoggerMock { get; private set; }
    protected Conference TestConference { get; set; }

    private EventComponentHelper _eventComponentHelper;
    
    [SetUp]
    public void Setup()
    {
        _eventComponentHelper = new EventComponentHelper();
        EventHandlersList = _eventComponentHelper.GetHandlers();
        EventHubContextMock = _eventComponentHelper.EventHubContextMock;
        EventHubClientMock = _eventComponentHelper.EventHubClientMock;
        MemoryCache = _eventComponentHelper.Cache;
        ConferenceServiceMock = _eventComponentHelper.ConferenceServiceMock;
        LoggerMock = _eventComponentHelper.EventHandlerBaseMock;
        
        TestConference = new ConferenceCacheModelBuilder().WithLinkedParticipantsInRoom().Build();
        MemoryCache.Set(TestConference.Id, TestConference);
        
        ConferenceServiceMock.Setup(x => x.GetConference(TestConference.Id, It.IsAny<CancellationToken>())).ReturnsAsync(TestConference);
        ConferenceServiceMock.Setup(x => x.ForceGetConference(TestConference.Id, It.IsAny<CancellationToken>())).ReturnsAsync(TestConference);
        
        _eventComponentHelper.RegisterUsersForHubContext(TestConference.Participants);
    }

    protected void AddParticipantToConference(Role role)
    {
        var staffMemberParticipant = Builder<Participant>.CreateNew()
            .With(x => x.Role = role).With(x => x.Id = Guid.NewGuid())
            .With(x => x.Username = Faker.Internet.Email())
            .Build();
        
        TestConference.Participants.Add(staffMemberParticipant);
        _eventComponentHelper.RegisterParticipantForHubContext(staffMemberParticipant);
    }
}
