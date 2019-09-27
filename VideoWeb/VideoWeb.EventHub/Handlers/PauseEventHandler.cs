using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Caching.Memory;
using VideoWeb.EventHub.Enums;
using VideoWeb.EventHub.Handlers.Core;
using VideoWeb.EventHub.Hub;
using VideoWeb.EventHub.Models;

namespace VideoWeb.EventHub.Handlers
{
    public class PauseEventHandler : EventHandlerBase
    {
        public PauseEventHandler(IHubContext<Hub.EventHub, IEventHubClient> hubContext, IMemoryCache memoryCache) : base(hubContext, memoryCache)
        {
        }

        public override EventType EventType => EventType.Pause;

        protected override async Task PublishStatusAsync(CallbackEvent callbackEvent)
        {
            var conferenceState = ConferenceState.Paused;
            await PublishConferenceStatusMessage(conferenceState);
        }
    }
}