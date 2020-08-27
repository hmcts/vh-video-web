using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using VideoWeb.Common.Caching;
using VideoWeb.EventHub.Handlers.Core;
using VideoWeb.EventHub.Hub;
using VideoWeb.EventHub.Models;
using VideoWeb.Services.Video;
using EndpointState = VideoWeb.EventHub.Enums.EndpointState;
using EventType = VideoWeb.EventHub.Enums.EventType;

namespace VideoWeb.EventHub.Handlers
{
    public class EndpointJoinedEventHandler : EventHandlerBase
    {
        public EndpointJoinedEventHandler(IHubContext<Hub.EventHub, IEventHubClient> hubContext,
            IConferenceCache conferenceCache, ILogger<EventHandlerBase> logger, IVideoApiClient videoApiClient) : base(
            hubContext, conferenceCache, logger, videoApiClient)
        {
        }

        public override EventType EventType => EventType.EndpointJoined;
        protected override async Task PublishStatusAsync(CallbackEvent callbackEvent)
        {
            await PublishEndpointStatusMessage(EndpointState.Connected);
        }
    }
}
