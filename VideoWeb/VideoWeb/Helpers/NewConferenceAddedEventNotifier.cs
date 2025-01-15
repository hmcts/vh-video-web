using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using VideoWeb.Common.Models;
using VideoWeb.EventHub.Hub;
using VideoWeb.Helpers.Interfaces;

namespace VideoWeb.Helpers
{
    public class NewConferenceAddedEventNotifier(IHubContext<EventHub.Hub.EventHub, IEventHubClient> hubContext)
        : INewConferenceAddedEventNotifier
    {
        public async Task PushNewConferenceAddedEvent(Conference conference)
        {
            foreach (var participant in conference.Participants.Where(p => p.Role != Role.StaffMember))
            {
                await hubContext.Clients.Group(participant.Username.ToLowerInvariant())
                    .NewConferenceAddedMessage(conference.Id);
            }

            await hubContext.Clients.Group(VideoWeb.EventHub.Hub.EventHub.VhOfficersGroupName)
                .NewConferenceAddedMessage(conference.Id);

            await hubContext.Clients.Group(VideoWeb.EventHub.Hub.EventHub.StaffMembersGroupName)
                .NewConferenceAddedMessage(conference.Id);
        }
    }
}
