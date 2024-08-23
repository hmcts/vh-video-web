using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using VideoWeb.Common.Models;
using EventType = VideoWeb.EventHub.Enums.EventType;

namespace VideoWeb.EventHub.Handlers
{
    public class SuspendEventHandler(
        IHubContext<Hub.EventHub, IEventHubClient> hubContext,
        IConferenceService conferenceService,
        ILogger<EventHandlerBase> logger)
        : EventHandlerBase(hubContext, conferenceService, logger)
    {
        public override EventType EventType => EventType.Suspend;

        protected override Task PublishStatusAsync(CallbackEvent callbackEvent)
        {
            return PublishConferenceStatusMessage(ConferenceStatus.Suspended);
        }
    }
}
