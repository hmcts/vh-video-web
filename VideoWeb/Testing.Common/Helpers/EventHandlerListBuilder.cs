using System.Collections.Generic;
using Microsoft.AspNetCore.SignalR;
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
            return new List<IEventHandler>
            {
                new CloseEventHandler(eventHubContextMock.Object),
                new DisconnectedEventHandler(eventHubContextMock.Object),
                new HelpEventHandler(eventHubContextMock.Object),
                new JoinedEventHandler(eventHubContextMock.Object),
                new JudgeAvailableEventHandler(eventHubContextMock.Object),
                new LeaveEventHandler(eventHubContextMock.Object),
                new PauseEventHandler(eventHubContextMock.Object),
                new SuspendEventHandler(eventHubContextMock.Object),
                new TransferEventHandler(eventHubContextMock.Object),
                new ParticipantJoiningEventHandler(eventHubContextMock.Object),
                new SelfTestFailedEventHandler(eventHubContextMock.Object),
                new VhOfficerCallEventHandler(eventHubContextMock.Object)
            };
        }
    }
}