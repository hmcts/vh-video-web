using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using VideoWeb.Common.Models;
using VideoWeb.EventHub.Hub;
using VideoWeb.Helpers.Interfaces;
using VideoWeb.Mappings;
using Hub = VideoWeb.EventHub.Hub;

namespace VideoWeb.Helpers
{
    public class HearingDetailsUpdatedEventNotifier(IHubContext<Hub.EventHub, IEventHubClient> hubContext) 
        : IHearingDetailsUpdatedEventNotifier
    {
        public async Task PushHearingDetailsUpdatedEvent(Conference conference)
        {
            var conferenceResponse = ConferenceResponseMapper.Map(conference);
            
            foreach (var participant in conference.Participants.Where(participant => participant.Role != Role.StaffMember))
            {
                await hubContext.Clients.Group(participant.Username.ToLowerInvariant())
                    .HearingDetailsUpdatedMessage(conferenceResponse);
            }
                
            await hubContext.Clients.Group(Hub.EventHub.VhOfficersGroupName)
                .HearingDetailsUpdatedMessage(conferenceResponse);
                
            await hubContext.Clients.Group(Hub.EventHub.StaffMembersGroupName)
                .HearingDetailsUpdatedMessage(conferenceResponse);
        }
    }
}
