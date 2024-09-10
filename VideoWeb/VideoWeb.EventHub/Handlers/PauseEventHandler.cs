using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using VideoWeb.Common.Models;
using EventType = VideoWeb.EventHub.Enums.EventType;

namespace VideoWeb.EventHub.Handlers
{
    public class PauseEventHandler : EventHandlerBase
    {
        public override EventType EventType => EventType.Pause;

        public PauseEventHandler(IHubContext<Hub.EventHub, IEventHubClient> hubContext,
            IConferenceService conferenceService,
            ILogger<EventHandlerBase> logger)
            : base(hubContext, conferenceService, logger)
        {
        }
        
        protected override Task PublishStatusAsync(CallbackEvent callbackEvent)
        {
            return PublishConferenceStatusMessage(ConferenceStatus.Paused);
        }
    }
}
