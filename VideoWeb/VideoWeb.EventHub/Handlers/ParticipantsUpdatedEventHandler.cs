using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using System.Threading.Tasks;
using VideoApi.Client;
using VideoWeb.Common.Caching;
using VideoWeb.EventHub.Handlers.Core;
using VideoWeb.EventHub.Hub;
using VideoWeb.EventHub.Models;
using EventType = VideoWeb.EventHub.Enums.EventType;

namespace VideoWeb.EventHub.Handlers
{
    public class ParticipantsUpdatedEventHandler : EventHandlerBase
    {
        public ParticipantsUpdatedEventHandler(IHubContext<Hub.EventHub, IEventHubClient> hubContext,
            IConferenceCache conferenceCache, ILogger<EventHandlerBase> logger, IVideoApiClient videoApiClient) : base(
            hubContext, conferenceCache, logger, videoApiClient)
        {
        }

        public override EventType EventType => EventType.ParticipantsUpdated;
         
        protected override Task PublishStatusAsync(CallbackEvent callbackEvent)
        {
            return PublishParticipantsUpdatedMessage(callbackEvent.Participants);
        }
    }
}
