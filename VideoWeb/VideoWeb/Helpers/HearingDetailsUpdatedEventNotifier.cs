using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using VideoWeb.Common.Models;
using VideoWeb.EventHub.Hub;
using VideoWeb.Helpers.Interfaces;
using Hub = VideoWeb.EventHub.Hub;

namespace VideoWeb.Helpers
{
    public class HearingDetailsUpdatedEventNotifier : IHearingDetailsUpdatedEventNotifier
    {
        private readonly IHubContext<Hub.EventHub, IEventHubClient> _hubContext;
        
        public HearingDetailsUpdatedEventNotifier(IHubContext<Hub.EventHub, IEventHubClient> hubContext)
        {
            _hubContext = hubContext;
        }
        
        public async Task PushHearingDetailsUpdatedEvent(Conference conference)
        {
            foreach (var participant in conference.Participants.Where(participant => participant.Role != Role.StaffMember))
            {
                await _hubContext.Clients.Group(participant.Username.ToLowerInvariant())
                    .HearingDetailsUpdatedMessage(conference.Id);
            }
                
            await _hubContext.Clients.Group(Hub.EventHub.VhOfficersGroupName)
                .HearingDetailsUpdatedMessage(conference.Id);
                
            await _hubContext.Clients.Group(Hub.EventHub.StaffMembersGroupName)
                .HearingDetailsUpdatedMessage(conference.Id);
        }
    }
}
