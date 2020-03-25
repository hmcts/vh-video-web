using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using VideoWeb.Common.Caching;
using VideoWeb.EventHub.Enums;
using VideoWeb.EventHub.Handlers.Core;
using VideoWeb.EventHub.Hub;
using VideoWeb.EventHub.Models;

namespace VideoWeb.EventHub.Handlers
{
    public class HelpEventHandler : EventHandlerBase
    {
        public HelpEventHandler(IHubContext<Hub.EventHub, IEventHubClient> hubContext, IConferenceCache conferenceCache, ILogger<EventHandlerBase> logger) : base(hubContext, conferenceCache, logger)
        {
        }

        public override EventType EventType => EventType.Help;

        protected override async Task PublishStatusAsync(CallbackEvent callbackEvent)
        {
            await HubContext.Clients.Group(Hub.EventHub.VhOfficersGroupName)
                .HelpMessage(SourceConference.Id, SourceParticipant.DisplayName);
        }
    }
}
