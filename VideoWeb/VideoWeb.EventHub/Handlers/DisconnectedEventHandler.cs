using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using VideoWeb.Common.Models;
using EventType = VideoWeb.EventHub.Enums.EventType;
using ParticipantState = VideoWeb.EventHub.Enums.ParticipantState;

namespace VideoWeb.EventHub.Handlers
{
    public class DisconnectedEventHandler : EventHandlerBase
    {
        public override EventType EventType => EventType.Disconnected;

        public DisconnectedEventHandler(IHubContext<Hub.EventHub, IEventHubClient> hubContext,
            IConferenceService conferenceService,
            ILogger<DisconnectedEventHandler> logger)
            : base(hubContext, conferenceService, logger)
        {
        }
        
        protected override Task PublishStatusAsync(CallbackEvent callbackEvent)
        {
            return PublishParticipantStatusMessage(ParticipantState.Disconnected, ParticipantStatus.Disconnected);
        }
    }
}
