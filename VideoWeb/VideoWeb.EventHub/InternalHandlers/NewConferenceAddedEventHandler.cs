using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using VideoWeb.EventHub.Hub;
using VideoWeb.EventHub.InternalHandlers.Core;
using VideoWeb.EventHub.InternalHandlers.Models;

namespace VideoWeb.EventHub.InternalHandlers
{
    public class NewConferenceAddedEventHandler : IInternalEventHandler<NewConferenceAddedEventDto>
    {
        private readonly IHubContext<VideoWeb.EventHub.Hub.EventHub, IEventHubClient> _hubContext;

        public NewConferenceAddedEventHandler(IHubContext<Hub.EventHub, IEventHubClient> hubContext)
        {
            _hubContext = hubContext;
        }

        public async Task HandleAsync(NewConferenceAddedEventDto eventPayload)
        {
            await _hubContext.Clients.Group(Hub.EventHub.VhOfficersGroupName)
                .NewConferenceAddedMessage(eventPayload.ConferenceId);
        }

        public async Task HandleAsync(object eventPayload)
        {
            var payload = eventPayload as NewConferenceAddedEventDto;
            await HandleAsync(payload);
        }
    }
}

