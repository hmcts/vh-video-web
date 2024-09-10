using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using EventType = VideoWeb.EventHub.Enums.EventType;

namespace VideoWeb.EventHub.Handlers
{
    public class CountdownFinishedEventHandler : EventHandlerBase
    {
        public override EventType EventType => EventType.CountdownFinished;

        public CountdownFinishedEventHandler(IHubContext<Hub.EventHub, IEventHubClient> hubContext,
            IConferenceService conferenceService,
            ILogger<EventHandlerBase> logger)
            : base(hubContext, conferenceService, logger)
        {
        }
        
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
