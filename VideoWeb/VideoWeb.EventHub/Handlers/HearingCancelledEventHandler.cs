using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using VideoWeb.EventHub.Enums;

namespace VideoWeb.EventHub.Handlers
{
    public class HearingCancelledEventHandler(
        IHubContext<Hub.EventHub, IEventHubClient> hubContext,
        IConferenceService conferenceService,
        ILogger<EventHandlerBase> logger)
        : EventHandlerBase(hubContext, conferenceService, logger)
    {

        public override EventType EventType => EventType.HearingCancelled;

        protected override Task PublishStatusAsync(CallbackEvent callbackEvent)
        {
            return PublishHearingCancelledMessage(callbackEvent.ConferenceId);
        }
        private async Task PublishHearingCancelledMessage(Guid conferenceId)
        {
            foreach (var participant in SourceConference.Participants)
            {
                await HubContext.Clients.Group(participant.Username.ToLowerInvariant())
                    .HearingCancelledMessage(SourceConference.Id);
            }
            
            await HubContext.Clients.Group(Hub.EventHub.VhOfficersGroupName)
                .HearingCancelledMessage(conferenceId);
        }
    }
}
