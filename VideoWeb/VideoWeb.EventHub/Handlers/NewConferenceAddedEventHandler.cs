using Microsoft.Extensions.Logging;
using System;
using System.Threading.Tasks;
using VideoWeb.EventHub.Enums;

namespace VideoWeb.EventHub.Handlers
{
    public class NewConferenceAddedEventHandler : EventHandlerBase
    {

        public override EventType EventType => EventType.NewConferenceAdded;

        public NewConferenceAddedEventHandler(IHubContext<Hub.EventHub, IEventHubClient> hubContext,
            IConferenceService conferenceService,
            ILogger<NewConferenceAddedEventHandler> logger)
            : base(hubContext, conferenceService, logger)
        {
        }
        
        protected override Task PublishStatusAsync(CallbackEvent callbackEvent)
        {
            return PublishNewConferenceAddedMessage(callbackEvent.ConferenceId);
        }
        private async Task PublishNewConferenceAddedMessage(Guid conferenceId)
        {
            await HubContext.Clients.Group(Hub.EventHub.VhOfficersGroupName)
                .NewConferenceAddedMessage(conferenceId);
        }
    }
}
