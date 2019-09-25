using System.Collections.Generic;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Caching.Memory;
using Moq;
using VideoWeb.EventHub.Handlers;
using VideoWeb.EventHub.Handlers.Core;
using VideoWeb.EventHub.Hub;

namespace Testing.Common.Helpers
{
    public static class EventHandlerListBuilder
    {
        public static List<IEventHandler> Get()
        {
            var eventHubContextMock = new Mock<IHubContext<EventHub, IEventHubClient>>();
            return Get(eventHubContextMock, new MemoryCache(new MemoryCacheOptions()));
        }

        public static List<IEventHandler> Get(Mock<IHubContext<EventHub, IEventHubClient>> eventHubContextMock,
            IMemoryCache memoryCache)
        {
            return new List<IEventHandler>
            {
                new CloseEventHandler(eventHubContextMock.Object, memoryCache),
                new DisconnectedEventHandler(eventHubContextMock.Object, memoryCache),
                new HelpEventHandler(eventHubContextMock.Object, memoryCache),
                new JoinedEventHandler(eventHubContextMock.Object, memoryCache),
                new JudgeAvailableEventHandler(eventHubContextMock.Object, memoryCache),
                new LeaveEventHandler(eventHubContextMock.Object, memoryCache),
                new PauseEventHandler(eventHubContextMock.Object, memoryCache),
                new SuspendEventHandler(eventHubContextMock.Object, memoryCache),
                new TransferEventHandler(eventHubContextMock.Object, memoryCache),
                new ParticipantJoiningEventHandler(eventHubContextMock.Object, memoryCache),
                new VhOfficerCallEventHandler(eventHubContextMock.Object, memoryCache)
            };
        }
    }
}