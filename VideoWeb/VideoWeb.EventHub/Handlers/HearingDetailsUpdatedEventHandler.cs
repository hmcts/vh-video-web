using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using VideoWeb.Common.Models;
using VideoWeb.EventHub.Enums;

namespace VideoWeb.EventHub.Handlers
{
    public class HearingDetailsUpdatedEventHandler(
        IHubContext<Hub.EventHub, IEventHubClient> hubContext,
        IConferenceService conferenceService,
        ILogger<EventHandlerBase> logger)
        : EventHandlerBase(hubContext, conferenceService, logger)
    {

        public override EventType EventType => EventType.HearingDetailsUpdated;

        protected override Task PublishStatusAsync(CallbackEvent callbackEvent)
        {
            return PublishHearingDetailsUpdatedMessage(callbackEvent.ConferenceId);
        }
        private async Task PublishHearingDetailsUpdatedMessage(Guid conferenceId)
        {
            foreach (var participant in SourceConference.Participants)
            {
                // Staff members already receive a message via the staff members group below, so don't message them here as well
                if (participant.Role != Role.StaffMember)
                    await HubContext.Clients.Group(participant.Username.ToLowerInvariant())
                        .HearingDetailsUpdatedMessage(SourceConference.Id);
            }
            
            await HubContext.Clients.Group(Hub.EventHub.VhOfficersGroupName)
                .HearingDetailsUpdatedMessage(conferenceId);
            
            await HubContext.Clients.Group(Hub.EventHub.StaffMembersGroupName)
                .HearingDetailsUpdatedMessage(conferenceId);
        }
    }
}
