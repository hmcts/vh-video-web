using Microsoft.Extensions.Logging;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using VideoWeb.Common.Models;
using VideoWeb.EventHub.Handlers.Core;
using VideoWeb.EventHub.Hub;
using VideoWeb.Helpers.Interfaces;
using VideoWeb.Mappings;
using VideoWeb.Common.Logging;

namespace VideoWeb.Helpers
{
    public class ParticipantsUpdatedEventNotifier(IHubContext<VideoWeb.EventHub.Hub.EventHub, IEventHubClient> hubContext,
        ILogger<EventHandlerBase> logger)
        : IParticipantsUpdatedEventNotifier
    {
        public async Task PushParticipantsUpdatedEvent(Conference conference, IList<Participant> participantsToNotify)
        {
            var updatedParticipants = conference.Participants.Select(ParticipantDtoForResponseMapper.Map).ToList();
            
            foreach (var participant in participantsToNotify.Where(p => p.Role != Role.StaffMember))
            {
                await hubContext.Clients.Group(participant.Username.ToLowerInvariant())
                    .ParticipantsUpdatedMessage(conference.Id, updatedParticipants);
                logger.LogUserRole(participant.Username,
                    participant.Role.ToString());
            }
        
            await hubContext.Clients.Group(VideoWeb.EventHub.Hub.EventHub.VhOfficersGroupName)
                .ParticipantsUpdatedMessage(conference.Id, updatedParticipants);
        
            await hubContext.Clients.Group(VideoWeb.EventHub.Hub.EventHub.StaffMembersGroupName)
                .ParticipantsUpdatedMessage(conference.Id, updatedParticipants);
        }
    }
}
