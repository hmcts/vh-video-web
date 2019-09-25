using System.Collections.Generic;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Caching.Memory;
using Moq;
using VideoWeb.EventHub.Handlers;
using VideoWeb.EventHub.Handlers.Core;
using VideoWeb.EventHub.Hub;
using VideoWeb.EventHub.Models;

namespace Testing.Common.Helpers
{
    public class EventComponentHelper
    {
        public List<IEventHandler> EventHandlersList { get; set; }
        public IMemoryCache Cache { get; set; }
        public Mock<IHubContext<EventHub, IEventHubClient>> EventHubContextMock { get; set; }
        public Mock<IEventHubClient> EventHubClientMock { get; set; }
        
        
        public List<IEventHandler> GetHandlers()
        {
            var cache = new MemoryCache(new MemoryCacheOptions());
            var eventHubContextMock = new Mock<IHubContext<EventHub, IEventHubClient>>();
            
            return GetHandlers(eventHubContextMock, cache);
        }

        public List<IEventHandler> GetHandlers(Mock<IHubContext<EventHub, IEventHubClient>> eventHubContextMock,
            IMemoryCache memoryCache)
        {
            Cache = memoryCache;
            EventHubContextMock = eventHubContextMock;
            EventHubClientMock = new Mock<IEventHubClient>();
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

        public void RegisterUsersForHubContext(IEnumerable<Participant> participants)
        {
            foreach (var participant in participants)
            {
                EventHubContextMock.Setup(x => x.Clients.Group(participant.Username.ToLowerInvariant()))
                    .Returns(EventHubClientMock.Object);
            }
            EventHubContextMock.Setup(x => x.Clients.Group(EventHub.VhOfficersGroupName))
                .Returns(EventHubClientMock.Object);
        }
    }
}