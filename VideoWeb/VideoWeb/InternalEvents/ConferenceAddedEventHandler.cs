using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using VideoWeb.EventHub.Hub;
using VideoWeb.InternalEvents.Core;

namespace VideoWeb.InternalEvents;

public class ConferenceAddedEvent : IInternalEvent
{
    public Guid ConferenceId { get; set; }
}

public class ConferenceAddedEventHandler : IInternalEventHandler<ConferenceAddedEvent>
{
     private readonly IHubContext<VideoWeb.EventHub.Hub.EventHub, IEventHubClient> _hubContext;
     
     public ConferenceAddedEventHandler(IHubContext<EventHub.Hub.EventHub, IEventHubClient> hubContext)
     {
         _hubContext = hubContext;
     }
     
     public async Task Handle(ConferenceAddedEvent internalEvent)
     {
         await _hubContext.Clients.Group(VideoWeb.EventHub.Hub.EventHub.VhOfficersGroupName)
             .NewConferenceAddedMessage(internalEvent.ConferenceId);
     }
}
