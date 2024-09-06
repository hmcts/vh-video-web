using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using VideoWeb.Common.Models;
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
                // Staff members already receive a message via the staff members group below, so don't message them here as well
                if (participant.Role != Role.StaffMember)
                    await HubContext.Clients.Group(participant.Username.ToLowerInvariant())
                        .HearingCancelledMessage(SourceConference.Id);
            }
            
            await HubContext.Clients.Group(Hub.EventHub.VhOfficersGroupName)
                .HearingCancelledMessage(conferenceId);
            
            await HubContext.Clients.Group(Hub.EventHub.StaffMembersGroupName)
                .HearingCancelledMessage(conferenceId);
        }
    }
}
