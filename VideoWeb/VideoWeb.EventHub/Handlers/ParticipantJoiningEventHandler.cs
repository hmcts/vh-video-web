using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using VideoWeb.Common.Models;
using EventType = VideoWeb.EventHub.Enums.EventType;
using ParticipantState = VideoWeb.EventHub.Enums.ParticipantState;

namespace VideoWeb.EventHub.Handlers
{
    public class ParticipantJoiningEventHandler(
        IHubContext<Hub.EventHub, IEventHubClient> hubContext,
        IConferenceService conferenceService,
        ILogger<EventHandlerBase> logger)
        : EventHandlerBase(hubContext, conferenceService, logger)
    {
        public override EventType EventType => EventType.ParticipantJoining;

        protected override Task PublishStatusAsync(CallbackEvent callbackEvent)
        {
            return PublishParticipantStatusMessage(ParticipantState.Joining, ParticipantStatus.Joining,
                callbackEvent.Reason, callbackEvent);
        }
    }
}
