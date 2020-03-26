using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using VideoWeb.Common.Caching;
using VideoWeb.EventHub.Handlers.Core;
using VideoWeb.EventHub.Hub;
using VideoWeb.EventHub.Models;
using VideoWeb.Services.Video;
using ConferenceState = VideoWeb.EventHub.Enums.ConferenceState;
using EventType = VideoWeb.EventHub.Enums.EventType;
using ParticipantState = VideoWeb.EventHub.Enums.ParticipantState;

namespace VideoWeb.EventHub.Handlers
{
    public class DisconnectedEventHandler : EventHandlerBase
    {
        public DisconnectedEventHandler(IHubContext<Hub.EventHub, IEventHubClient> hubContext,
            IConferenceCache conferenceCache, ILogger<EventHandlerBase> logger, IVideoApiClient videoApiClient) : base(
            hubContext, conferenceCache, logger, videoApiClient)
        {
        }

        public override EventType EventType => EventType.Disconnected;

        protected override async Task PublishStatusAsync(CallbackEvent callbackEvent)
        {
            await PublishParticipantDisconnectMessage().ConfigureAwait(false);
            if (SourceParticipant.IsJudge()) await PublishSuspendedEventMessage().ConfigureAwait(false);
        }

        private async Task PublishParticipantDisconnectMessage()
        {
            var participantState = ParticipantState.Disconnected;
            await PublishParticipantStatusMessage(participantState).ConfigureAwait(false);
        }

        private async Task PublishSuspendedEventMessage()
        {
            var conferenceState = ConferenceState.Suspended;
            await PublishConferenceStatusMessage(conferenceState).ConfigureAwait(false);
        }
    }
}
