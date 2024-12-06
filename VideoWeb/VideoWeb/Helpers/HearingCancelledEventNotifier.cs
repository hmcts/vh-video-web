using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using VideoWeb.Common.Models;
using VideoWeb.EventHub.Hub;
using VideoWeb.Helpers.Interfaces;
using Hub = VideoWeb.EventHub.Hub;

namespace VideoWeb.Helpers
{
    public class HearingCancelledEventNotifier(IHubContext<Hub.EventHubVIH11189, IEventHubClient> hubContext) 
        : IHearingCancelledEventNotifier
    {
        public async Task PushHearingCancelledEvent(Conference conference)
        {
            foreach (var participant in conference.Participants.Where(participant => participant.Role != Role.StaffMember))
            {
                await hubContext.Clients.Group(participant.Username.ToLowerInvariant())
                    .HearingCancelledMessage(conference.Id);
            }
                
            await hubContext.Clients.Group(Hub.EventHubVIH11189.VhOfficersGroupName)
                .HearingCancelledMessage(conference.Id);
                
            await hubContext.Clients.Group(Hub.EventHubVIH11189.StaffMembersGroupName)
                .HearingCancelledMessage(conference.Id);
        }
    }
}
