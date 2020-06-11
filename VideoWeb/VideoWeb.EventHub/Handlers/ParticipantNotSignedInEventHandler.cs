using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using VideoWeb.Common.Caching;
using VideoWeb.EventHub.Handlers.Core;
using VideoWeb.EventHub.Hub;
using VideoWeb.EventHub.Models;
using VideoWeb.Services.Video;
using EventType = VideoWeb.EventHub.Enums.EventType;
using ParticipantState = VideoWeb.EventHub.Enums.ParticipantState;


namespace VideoWeb.EventHub.Handlers
{
    public class ParticipantNotSignedInEventHandler : EventHandlerBase
    {
        public ParticipantNotSignedInEventHandler(IHubContext<Hub.EventHub, IEventHubClient> hubContext,
    IConferenceCache conferenceCache, ILogger<EventHandlerBase> logger, IVideoApiClient videoApiClient) : base(
    hubContext, conferenceCache, logger, videoApiClient)
        {
        }

        public override EventType EventType => EventType.ParticipantNotSignedIn;

        protected override async Task PublishStatusAsync(CallbackEvent callbackEvent)
        {
            var participantState = ParticipantState.NotSignedIn;
            await PublishParticipantStatusMessage(participantState);
        }
    }
}
