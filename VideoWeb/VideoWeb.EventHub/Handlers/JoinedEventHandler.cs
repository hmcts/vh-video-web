using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using VideoWeb.Common.Caching;
using VideoWeb.EventHub.Handlers.Core;
using VideoWeb.EventHub.Hub;
using VideoWeb.EventHub.Models;
using VideoApi.Client;
using VideoApi.Contract.Enums;
using VideoWeb.Common.Models;
using EventType = VideoWeb.EventHub.Enums.EventType;
using ParticipantState = VideoWeb.EventHub.Enums.ParticipantState;

namespace VideoWeb.EventHub.Handlers
{
    public class JoinedEventHandler : EventHandlerBase
    {
        public JoinedEventHandler(IHubContext<Hub.EventHub, IEventHubClient> hubContext,
            IConferenceCache conferenceCache, ILogger<EventHandlerBase> logger, IVideoApiClient videoApiClient) : base(
            hubContext, conferenceCache, logger, videoApiClient)
        {
        }

        public override EventType EventType => EventType.Joined;

        protected override Task PublishStatusAsync(CallbackEvent callbackEvent)
        {
            if (callbackEvent.IsParticipantInVmr && callbackEvent.ConferenceStatus == ConferenceState.InSession)
                return PublishParticipantStatusMessage(ParticipantState.InHearing);
            else if (callbackEvent.IsOtherParticipantsInConsultationRoom)
                return PublishParticipantStatusMessage(ParticipantState.InConsultation);

            return PublishParticipantStatusMessage(ParticipantState.Available);
        }
    }
}
