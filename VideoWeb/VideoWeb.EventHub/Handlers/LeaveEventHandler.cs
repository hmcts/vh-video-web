using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using VideoWeb.Common.Models;
using EventType = VideoWeb.EventHub.Enums.EventType;
using ParticipantState = VideoWeb.EventHub.Enums.ParticipantState;

namespace VideoWeb.EventHub.Handlers
{
    public class LeaveEventHandler : EventHandlerBase
    {
        public override EventType EventType => EventType.Leave;

        public LeaveEventHandler(IHubContext<Hub.EventHub, IEventHubClient> hubContext,
            IConferenceService conferenceService,
            ILogger<EventHandlerBase> logger)
            : base(hubContext, conferenceService, logger)
        {
        }

        protected override Task PublishStatusAsync(CallbackEvent callbackEvent)
        {
            if (SourceParticipant.ParticipantStatus == ParticipantStatus.InHearing || SourceParticipant.ParticipantStatus == ParticipantStatus.InConsultation)
                return PublishParticipantStatusMessage(ParticipantState.Disconnected, ParticipantStatus.Disconnected);

            return Task.CompletedTask;
        }
    }
}
