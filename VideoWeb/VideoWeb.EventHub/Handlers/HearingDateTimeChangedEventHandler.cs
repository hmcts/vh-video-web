using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using VideoWeb.EventHub.Enums;

namespace VideoWeb.EventHub.Handlers
{
    public class HearingDateTimeChangedEventHandler(
        IHubContext<Hub.EventHub, IEventHubClient> hubContext,
        IConferenceService conferenceService,
        ILogger<EventHandlerBase> logger)
        : EventHandlerBase(hubContext, conferenceService, logger)
    {

        public override EventType EventType => EventType.HearingDateTimeChanged;

        protected override Task PublishStatusAsync(CallbackEvent callbackEvent)
        {
            return PublishHearingDateTimeChangedMessage(callbackEvent.ConferenceId);
        }
        private async Task PublishHearingDateTimeChangedMessage(Guid conferenceId)
        {
            foreach (var participant in SourceConference.Participants)
            {
                await HubContext.Clients.Group(participant.Username.ToLowerInvariant())
                    .HearingDateTimeChangedMessage(SourceConference.Id);
            }
            
            await HubContext.Clients.Group(Hub.EventHub.VhOfficersGroupName)
                .HearingDateTimeChangedMessage(conferenceId);
        }
    }
}
