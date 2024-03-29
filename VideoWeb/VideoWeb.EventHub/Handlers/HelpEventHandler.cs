using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using VideoWeb.Common.Caching;
using VideoWeb.EventHub.Handlers.Core;
using VideoWeb.EventHub.Hub;
using VideoWeb.EventHub.Models;
using VideoApi.Client;
using EventType = VideoWeb.EventHub.Enums.EventType;

namespace VideoWeb.EventHub.Handlers
{
    public class HelpEventHandler : EventHandlerBase
    {
        public HelpEventHandler(IHubContext<Hub.EventHub, IEventHubClient> hubContext, IConferenceCache conferenceCache,
            ILogger<EventHandlerBase> logger, IVideoApiClient videoApiClient) : base(hubContext, conferenceCache,
            logger, videoApiClient)
        {
        }

        public override EventType EventType => EventType.Help;

        protected override Task PublishStatusAsync(CallbackEvent callbackEvent)
        {
            return HubContext.Clients.Group(Hub.EventHub.VhOfficersGroupName)
                .HelpMessage(SourceConference.Id, SourceParticipant?.DisplayName);
        }
    }
}
