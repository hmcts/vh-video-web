using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using VideoWeb.Common.Models;
using EventType = VideoWeb.EventHub.Enums.EventType;
using ParticipantState = VideoWeb.EventHub.Enums.ParticipantState;

namespace VideoWeb.EventHub.Handlers
{
    public class DisconnectedEventHandler(
        IHubContext<Hub.EventHub, IEventHubClient> hubContext,
        IConferenceService conferenceService,
        ILogger<EventHandlerBase> logger)
        : EventHandlerBase(hubContext, conferenceService, logger)
    {

        public override EventType EventType => EventType.Disconnected;

        protected override Task PublishStatusAsync(CallbackEvent callbackEvent)
        {
            return PublishParticipantStatusMessage(ParticipantState.Disconnected, ParticipantStatus.Disconnected,
                callbackEvent.Reason, callbackEvent);
        }
    }
}
