using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using VideoWeb.Common.Logging;
using EventType = VideoWeb.EventHub.Enums.EventType;

namespace VideoWeb.EventHub.Handlers
{
    public class CountdownFinishedEventHandler(
        IHubContext<Hub.EventHub, IEventHubClient> hubContext,
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
                Logger.LogConferenceCountdownFinished(SourceConference.Id);
            }

            await HubContext.Clients.Group(Hub.EventHub.VhOfficersGroupName)
                .CountdownFinished(SourceConference.Id);
        }
    }
}
