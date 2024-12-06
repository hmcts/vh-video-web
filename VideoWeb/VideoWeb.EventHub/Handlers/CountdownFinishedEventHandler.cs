using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using EventType = VideoWeb.EventHub.Enums.EventType;

namespace VideoWeb.EventHub.Handlers
{
    public class CountdownFinishedEventHandler(
        IHubContext<Hub.EventHubVIH11189, IEventHubClient> hubContext,
        IConferenceService conferenceService,
        ILogger<EventHandlerBase> logger)
        : EventHandlerBase(hubContext, conferenceService, logger)
    {

        public override EventType EventType => EventType.CountdownFinished;

        protected override async Task PublishStatusAsync(CallbackEvent callbackEvent)
        {
            foreach (var participant in SourceConference.Participants)
            {
                await HubContext.Clients.Group(participant.Username.ToLowerInvariant())
                    .CountdownFinished(SourceConference.Id);
                Logger.LogTrace("Conference Countdown finished: Conference Id: {SourceConferenceId}", SourceConference.Id);
            }

            await HubContext.Clients.Group(Hub.EventHubVIH11189.VhOfficersGroupName)
                .CountdownFinished(SourceConference.Id);
        }
    }
}
