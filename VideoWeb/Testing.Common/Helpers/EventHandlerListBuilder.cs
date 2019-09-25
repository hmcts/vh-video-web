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
            var memoryCacheMock = new Mock<IMemoryCache>();


            return new List<IEventHandler>
            {
                new CloseEventHandler(eventHubContextMock.Object, memoryCacheMock.Object),
                new DisconnectedEventHandler(eventHubContextMock.Object, memoryCacheMock.Object),
                new HelpEventHandler(eventHubContextMock.Object, memoryCacheMock.Object),
                new JoinedEventHandler(eventHubContextMock.Object, memoryCacheMock.Object),
                new JudgeAvailableEventHandler(eventHubContextMock.Object, memoryCacheMock.Object),
                new LeaveEventHandler(eventHubContextMock.Object, memoryCacheMock.Object),
                new PauseEventHandler(eventHubContextMock.Object, memoryCacheMock.Object),
                new SuspendEventHandler(eventHubContextMock.Object, memoryCacheMock.Object),
                new TransferEventHandler(eventHubContextMock.Object, memoryCacheMock.Object),
                new ParticipantJoiningEventHandler(eventHubContextMock.Object, memoryCacheMock.Object),
                new VhOfficerCallEventHandler(eventHubContextMock.Object, memoryCacheMock.Object)
            };
        }
    }
}