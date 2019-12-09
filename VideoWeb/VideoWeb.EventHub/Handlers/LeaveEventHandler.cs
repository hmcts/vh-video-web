using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using VideoWeb.EventHub.Enums;
using VideoWeb.EventHub.Handlers.Core;
using VideoWeb.EventHub.Hub;
using VideoWeb.EventHub.Models;

namespace VideoWeb.EventHub.Handlers
{
    public class LeaveEventHandler : EventHandlerBase
    {
        public LeaveEventHandler(IHubContext<Hub.EventHub, IEventHubClient> hubContext, IMemoryCache memoryCache, ILogger<EventHandlerBase> logger) : base(hubContext, memoryCache, logger)
        {
        }

        public override EventType EventType => EventType.Leave;

        protected override async Task PublishStatusAsync(CallbackEvent callbackEvent)
        {
            var participantState = ParticipantState.Disconnected;
            await PublishParticipantStatusMessage(participantState);
        }
    }
}