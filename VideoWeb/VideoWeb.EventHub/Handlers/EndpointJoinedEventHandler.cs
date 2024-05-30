using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using VideoWeb.Common.Caching;
using VideoWeb.EventHub.Handlers.Core;
using VideoWeb.EventHub.Hub;
using VideoWeb.EventHub.Models;
using VideoApi.Client;
using VideoWeb.Common;
using EndpointState = VideoWeb.EventHub.Enums.EndpointState;
using EventType = VideoWeb.EventHub.Enums.EventType;

namespace VideoWeb.EventHub.Handlers
{
    public class EndpointJoinedEventHandler(
        IHubContext<Hub.EventHub, IEventHubClient> hubContext,
        IConferenceService conferenceService,
        ILogger<EventHandlerBase> logger)
        : EventHandlerBase(hubContext, conferenceService, logger)
    {

        public override EventType EventType => EventType.EndpointJoined;

        protected override Task PublishStatusAsync(CallbackEvent callbackEvent)
        {
            return PublishEndpointStatusMessage(EndpointState.Connected);
        }
    }
}
