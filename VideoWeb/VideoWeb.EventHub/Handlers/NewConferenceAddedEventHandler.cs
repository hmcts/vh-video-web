using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using VideoApi.Client;
using VideoApi.Contract.Requests;
using VideoWeb.Common.Caching;
using VideoWeb.EventHub.Enums;
using VideoWeb.EventHub.Handlers.Core;
using VideoWeb.EventHub.Hub;
using VideoWeb.EventHub.Models;

namespace VideoWeb.EventHub.Handlers
{
    public class NewConferenceAddedEventHandler : EventHandlerBase
    {
        public NewConferenceAddedEventHandler(IHubContext<Hub.EventHubPPS2, IEventHubClient> hubContext,
            IConferenceCache conferenceCache, ILogger<EventHandlerBase> logger, IVideoApiClient videoApiClient) : base(
            hubContext, conferenceCache, logger, videoApiClient)
        {
        }

        public override EventType EventType => EventType.NewConferenceAdded;

        protected override Task PublishStatusAsync(CallbackEvent callbackEvent)
        {
            return PublishNewConferenceAddedMessage(callbackEvent.ConferenceId);
        }
        private async Task PublishNewConferenceAddedMessage(Guid conferenceId)
        {
            await HubContext.Clients.Group(Hub.EventHubPPS2.VhOfficersGroupName)
                .NewConferenceAddedMessage(conferenceId);
        }
    }
}
