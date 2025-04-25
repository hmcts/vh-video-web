using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using VideoWeb.Common.Models;
using EventType = VideoWeb.EventHub.Enums.EventType;

namespace VideoWeb.EventHub.Handlers
{
    public class CloseEventHandler(
        IHubContext<Hub.EventHub, IEventHubClient> hubContext,
        IConferenceService conferenceService,
        ILogger<EventHandlerBase> logger)
        : EventHandlerBase(hubContext, conferenceService, logger)
    {

        public override EventType EventType => EventType.Close;

        protected override Task PublishStatusAsync(CallbackEvent callbackEvent)
        {
            var conferenceState = ConferenceStatus.Closed;
            return PublishConferenceStatusMessage(conferenceState, callbackEvent);
        }
    }
}
