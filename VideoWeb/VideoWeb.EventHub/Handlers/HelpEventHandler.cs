using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using EventType = VideoWeb.EventHub.Enums.EventType;

namespace VideoWeb.EventHub.Handlers
{
    public class HelpEventHandler(
        IHubContext<Hub.EventHubVIH11189, IEventHubClient> hubContext,
        IConferenceService conferenceService,
        ILogger<EventHandlerBase> logger)
        : EventHandlerBase(hubContext, conferenceService, logger)
    {

        public override EventType EventType => EventType.Help;

        protected override Task PublishStatusAsync(CallbackEvent callbackEvent)
        {
            return HubContext.Clients.Group(Hub.EventHubVIH11189.VhOfficersGroupName)
                .HelpMessage(SourceConference.Id, SourceParticipant?.DisplayName);
        }
    }
}
