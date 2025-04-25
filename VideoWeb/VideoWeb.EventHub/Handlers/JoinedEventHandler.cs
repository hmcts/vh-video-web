using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using VideoApi.Contract.Enums;
using VideoWeb.Common.Models;
using EventType = VideoWeb.EventHub.Enums.EventType;
using ParticipantState = VideoWeb.EventHub.Enums.ParticipantState;

namespace VideoWeb.EventHub.Handlers
{
    public class JoinedEventHandler(
        IHubContext<Hub.EventHub, IEventHubClient> hubContext,
        IConferenceService conferenceService,
        ILogger<EventHandlerBase> logger)
        : EventHandlerBase(hubContext, conferenceService, logger)
    {

        public override EventType EventType => EventType.Joined;

        protected override async Task PublishStatusAsync(CallbackEvent callbackEvent)
        {
            var newStatus = ParticipantStatus.Available;
            var state = ParticipantState.Available;
            if (callbackEvent.IsParticipantInVmr && callbackEvent.ConferenceStatus == ConferenceState.InSession)
            {
                newStatus = ParticipantStatus.InHearing;
                state = ParticipantState.InHearing;
            }
            else if (callbackEvent.IsOtherParticipantsInConsultationRoom)
            {
                newStatus = ParticipantStatus.InConsultation;
                state = ParticipantState.InConsultation;
            }

            Logger.LogTrace("Participant {ParticipantId} joined conference {ConferenceId} with status {ParticipantStatus}",
                callbackEvent.ParticipantId, callbackEvent.ConferenceId, newStatus);
            await PublishParticipantStatusMessage(state, newStatus, callbackEvent.Reason, callbackEvent);
        }
    }
}
