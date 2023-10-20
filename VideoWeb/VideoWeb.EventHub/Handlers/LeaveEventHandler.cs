using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using VideoWeb.Common.Caching;
using VideoWeb.EventHub.Handlers.Core;
using VideoWeb.EventHub.Hub;
using VideoWeb.EventHub.Models;
using VideoApi.Client;
using EventType = VideoWeb.EventHub.Enums.EventType;
using ParticipantState = VideoWeb.EventHub.Enums.ParticipantState;

namespace VideoWeb.EventHub.Handlers
{
    public class LeaveEventHandler : EventHandlerBase
    {
        public LeaveEventHandler(IHubContext<Hub.EventHub, IEventHubClient> hubContext,
            IConferenceCache conferenceCache, ILogger<EventHandlerBase> logger, IVideoApiClient videoApiClient) : base(
            hubContext, conferenceCache, logger, videoApiClient)
        {
        }

        public override EventType EventType => EventType.Leave;

        protected override Task PublishStatusAsync(CallbackEvent callbackEvent)
        {
            if (SourceParticipant.ParticipantStatus == Common.Models.ParticipantStatus.InHearing || SourceParticipant.ParticipantStatus == Common.Models.ParticipantStatus.InConsultation)
                return PublishParticipantStatusMessage(ParticipantState.Disconnected);

            return Task.CompletedTask;
        }
    }
}
