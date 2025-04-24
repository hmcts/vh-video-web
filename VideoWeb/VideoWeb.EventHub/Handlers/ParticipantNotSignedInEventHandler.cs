using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using VideoWeb.Common.Models;
using EventType = VideoWeb.EventHub.Enums.EventType;
using ParticipantState = VideoWeb.EventHub.Enums.ParticipantState;


namespace VideoWeb.EventHub.Handlers
{
    public class ParticipantNotSignedInEventHandler(
        IHubContext<Hub.EventHub, IEventHubClient> hubContext,
        IConferenceService conferenceService,
        ILogger<EventHandlerBase> logger)
        : EventHandlerBase(hubContext, conferenceService, logger)
    {
        

        public override EventType EventType => EventType.ParticipantNotSignedIn;

        protected override Task PublishStatusAsync(CallbackEvent callbackEvent)
        {
            return PublishParticipantStatusMessage(ParticipantState.NotSignedIn, ParticipantStatus.NotSignedIn, callbackEvent.Reason, null);
        }
    }
}
