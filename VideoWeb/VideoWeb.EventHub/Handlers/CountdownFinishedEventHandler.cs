using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using VideoWeb.Common.Caching;
using VideoWeb.EventHub.Handlers.Core;
using VideoWeb.EventHub.Hub;
using VideoWeb.EventHub.Models;
using VideoWeb.Services.Video;
using EventType = VideoWeb.EventHub.Enums.EventType;

namespace VideoWeb.EventHub.Handlers
{
    public class CountdownFinishedEventHandler : EventHandlerBase
    {
        public CountdownFinishedEventHandler(IHubContext<Hub.EventHub, IEventHubClient> hubContext,
            IConferenceCache conferenceCache, ILogger<EventHandlerBase> logger, IVideoApiClient videoApiClient) : base(
            hubContext, conferenceCache, logger, videoApiClient)
        {
        }

        public override EventType EventType => EventType.CountdownFinished;

        protected override async Task PublishStatusAsync(CallbackEvent callbackEvent)
        {
            foreach (var participant in SourceConference.Participants)
            {
                await HubContext.Clients.Group(participant.Username.ToLowerInvariant())
                    .CountdownFinished(SourceConference.Id);
                Logger.LogTrace($"Conference Countdown finished: Conference Id: { SourceConference.Id }");
            }
            await HubContext.Clients.Group(Hub.EventHub.VhOfficersGroupName)
                .CountdownFinished(SourceConference.Id);
        }
    }
}
