using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using VideoWeb.Common.Models;
using EventType = VideoWeb.EventHub.Enums.EventType;
using ParticipantState = VideoWeb.EventHub.Enums.ParticipantState;


namespace VideoWeb.EventHub.Handlers
{
    public class ParticipantNotSignedInEventHandler : EventHandlerBase
    {
        public override EventType EventType => EventType.ParticipantNotSignedIn;

        public ParticipantNotSignedInEventHandler(IHubContext<Hub.EventHub, IEventHubClient> hubContext,
            IConferenceService conferenceService,
            ILogger<EventHandlerBase> logger)
            : base(hubContext, conferenceService, logger)
        {
        }
        
        protected override Task PublishStatusAsync(CallbackEvent callbackEvent)
        {
            return PublishParticipantStatusMessage(ParticipantState.NotSignedIn, ParticipantStatus.NotSignedIn);
        }
    }
}
