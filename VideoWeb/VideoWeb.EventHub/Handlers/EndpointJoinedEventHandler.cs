using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using VideoWeb.Common.Models;
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
            return PublishEndpointStatusMessage(EndpointState.Connected, EndpointStatus.Connected, callbackEvent);
        }
    }
}
