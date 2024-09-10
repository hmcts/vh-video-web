using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using VideoApi.Contract.Enums;
using VideoWeb.Common.Models;
using EventType = VideoWeb.EventHub.Enums.EventType;
using ParticipantState = VideoWeb.EventHub.Enums.ParticipantState;

namespace VideoWeb.EventHub.Handlers
{
    public class JoinedEventHandler : EventHandlerBase
    {

        public override EventType EventType => EventType.Joined;

        public JoinedEventHandler(IHubContext<Hub.EventHub, IEventHubClient> hubContext,
            IConferenceService conferenceService,
            ILogger<JoinedEventHandler> logger)
            : base(hubContext, conferenceService, logger)
        {
        }
        
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

            await PublishParticipantStatusMessage(state, newStatus);
        }
    }
}
