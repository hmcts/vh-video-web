using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using VideoWeb.EventHub.Enums;
using VideoWeb.EventHub.Handlers.Core;
using VideoWeb.EventHub.Hub;
using VideoWeb.EventHub.Models;

namespace VideoWeb.EventHub.Handlers
{
    public class JoinedEventHandler : EventHandlerBase
    {
        public JoinedEventHandler(IHubContext<Hub.EventHub, IEventHubClient> hubContext) : base(hubContext)
        {
        }

        public override EventType EventType => EventType.Joined;

        protected override async Task PublishStatusAsync(CallbackEvent callbackEvent)
        {
            var participantState = SourceParticipant.IsJudge() ? ParticipantState.InHearing : ParticipantState.Available;
            await PublishParticipantStatusMessage(participantState).ConfigureAwait(false);
            if (SourceParticipant.IsJudge()) await PublishLiveEventMessage();
        }

        private async Task PublishLiveEventMessage()
        {
            var conferenceEvent = ConferenceState.InSession;
            await PublishConferenceStatusMessage(conferenceEvent);
        }
    }
}