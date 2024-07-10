using System.Collections.Generic;
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
    
    [SetUp]
    public void Setup()
    {
        var helper = new EventComponentHelper();
        EventHandlersList = helper.GetHandlers();
        EventHubContextMock = helper.EventHubContextMock;
        EventHubClientMock = helper.EventHubClientMock;
        MemoryCache = helper.Cache;
        ConferenceServiceMock = helper.ConferenceServiceMock;
        LoggerMock = helper.EventHandlerBaseMock;
        
        TestConference = new ConferenceCacheModelBuilder().WithLinkedParticipantsInRoom().Build();
        MemoryCache.Set(TestConference.Id, TestConference);
        
        ConferenceServiceMock.Setup(x => x.GetConference(TestConference.Id)).ReturnsAsync(TestConference);
        
        helper.RegisterUsersForHubContext(TestConference.Participants);
    }
}
