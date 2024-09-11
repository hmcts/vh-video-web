using Microsoft.Extensions.Logging;
using System;
using System.Linq;
using System.Threading.Tasks;
using VideoWeb.Common.Models;
using VideoWeb.EventHub.Enums;

namespace VideoWeb.EventHub.Handlers
{
    public class NewConferenceAddedEventHandler(
        IHubContext<Hub.EventHub, IEventHubClient> hubContext,
        IConferenceService conferenceService,
        ILogger<EventHandlerBase> logger)
        : EventHandlerBase(hubContext, conferenceService, logger)
    {

        public override EventType EventType => EventType.NewConferenceAdded;

        protected override Task PublishStatusAsync(CallbackEvent callbackEvent)
        {
            return PublishNewConferenceAddedMessage(callbackEvent.ConferenceId);
        }
        private async Task PublishNewConferenceAddedMessage(Guid conferenceId)
        {
            foreach (var participant in SourceConference.Participants.Where(p => p.Role != Role.StaffMember))
            {
                await HubContext.Clients.Group(participant.Username.ToLowerInvariant())
                    .NewConferenceAddedMessage(SourceConference.Id);
            }
            
            await HubContext.Clients.Group(Hub.EventHub.VhOfficersGroupName)
                .NewConferenceAddedMessage(conferenceId);
            
            await HubContext.Clients.Group(Hub.EventHub.StaffMembersGroupName)
                .NewConferenceAddedMessage(conferenceId);
        }
    }
}
