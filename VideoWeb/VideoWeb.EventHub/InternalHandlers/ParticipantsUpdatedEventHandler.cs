using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using VideoWeb.EventHub.Hub;
using VideoWeb.EventHub.InternalHandlers.Core;
using VideoWeb.EventHub.InternalHandlers.Models;

namespace VideoWeb.EventHub.InternalHandlers
{
    public class ParticipantsUpdatedEventHandler : IInternalEventHandler<ParticipantsUpdatedEventDto>
    {
        private readonly IHubContext<VideoWeb.EventHub.Hub.EventHub, IEventHubClient> _hubContext;

        public ParticipantsUpdatedEventHandler(IHubContext<Hub.EventHub, IEventHubClient> hubContext)
        {
            _hubContext = hubContext;
        }

        public async Task HandleAsync(ParticipantsUpdatedEventDto eventPayload)
        {
            foreach (var participant in eventPayload.Participants)
            {
                await _hubContext.Clients.Group(participant.UserName.ToLowerInvariant())
                    .ParticipantsUpdatedMessage(eventPayload.ConferenceId, eventPayload.Participants);
            }

            await _hubContext.Clients.Group(Hub.EventHub.VhOfficersGroupName)
                .ParticipantsUpdatedMessage(eventPayload.ConferenceId, eventPayload.Participants);
        }

        public async Task HandleAsync(object eventPayload)
        {
            var payload = eventPayload as ParticipantsUpdatedEventDto;
            await HandleAsync(payload);
        }
    }
}
