using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using VideoWeb.Common.Models;
using EndpointState = VideoWeb.EventHub.Enums.EndpointState;
using EventType = VideoWeb.EventHub.Enums.EventType;

namespace VideoWeb.EventHub.Handlers
{
    public class EndpointJoinedEventHandler : EventHandlerBase
    {
        public override EventType EventType => EventType.EndpointJoined;

        public EndpointJoinedEventHandler(IHubContext<Hub.EventHub, IEventHubClient> hubContext,
            IConferenceService conferenceService,
            ILogger<EventHandlerBase> logger)
            : base(hubContext, conferenceService, logger)
        {
        }

        protected override Task PublishStatusAsync(CallbackEvent callbackEvent)
        {
            return PublishEndpointStatusMessage(EndpointState.Connected, EndpointStatus.Connected);
        }
    }
}
