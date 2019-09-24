using System.Collections.Generic;
using Microsoft.AspNetCore.SignalR;
using Moq;
using NUnit.Framework;
using Testing.Common.Helpers;
using VideoWeb.EventHub.Handlers.Core;
using VideoWeb.EventHub.Hub;

namespace VideoWeb.UnitTests.EventHandlers
{
    public abstract class EventHandlerTestBase
    {
        protected List<IEventHandler> EventHandlersList;
        protected Mock<IEventHubClient> EventHubClientMock;
        protected Mock<IHubContext<EventHub.Hub.EventHub, IEventHubClient>> EventHubContextMock;

        
        [SetUp]
        public void Setup()
        {
            EventHubContextMock = new Mock<IHubContext<EventHub.Hub.EventHub, IEventHubClient>>();
            EventHubClientMock = new Mock<IEventHubClient>();

            EventHandlersList = EventHandlerListBuilder.Get();
        }
    }
}