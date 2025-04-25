using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using EventType = VideoWeb.EventHub.Enums.EventType;

namespace VideoWeb.EventHub.Handlers
{
    public class CountdownFinishedEventHandler(
        IHubContext<Hub.EventHub, IEventHubClient> hubContext,
        IConferenceService conferenceService,
        ILogger<EventHandlerBase> logger)
        : EventHandlerBase(hubContext, conferenceService, logger)
    {
        private readonly IConferenceService _conferenceService = conferenceService;

        public override EventType EventType => EventType.CountdownFinished;

        protected override async Task PublishStatusAsync(CallbackEvent callbackEvent)
        {
            SourceConference.CountdownComplete = true;
            await _conferenceService.UpdateConferenceAsync(SourceConference);
            foreach (var participant in SourceConference.Participants)
            {
                await HubContext.Clients.Group(participant.Username.ToLowerInvariant())
                    .CountdownFinished(SourceConference.Id);
                Logger.LogTrace("Conference Countdown finished: Conference Id: {SourceConferenceId}", SourceConference.Id);
            }

            await HubContext.Clients.Group(Hub.EventHub.VhOfficersGroupName)
                .CountdownFinished(SourceConference.Id);
        }
    }
}
