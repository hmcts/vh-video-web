using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using VideoWeb.Common.Models;
using EventType = VideoWeb.EventHub.Enums.EventType;
using ParticipantState = VideoWeb.EventHub.Enums.ParticipantState;

namespace VideoWeb.EventHub.Handlers
{
    public class LeaveEventHandler(
        IHubContext<Hub.EventHub, IEventHubClient> hubContext,
        IConferenceService conferenceService,
        ILogger<EventHandlerBase> logger)
        : EventHandlerBase(hubContext, conferenceService, logger)
    {

        public override EventType EventType => EventType.Leave;

        protected override Task PublishStatusAsync(CallbackEvent callbackEvent)
        {
            var anotherDeviceDetected = callbackEvent.Reason.Contains("has connected on another device",
                StringComparison.InvariantCultureIgnoreCase);
            if (SourceParticipant.ParticipantStatus == ParticipantStatus.InHearing ||
                SourceParticipant.ParticipantStatus == ParticipantStatus.InConsultation || anotherDeviceDetected)
                return PublishParticipantStatusMessage(ParticipantState.Disconnected, ParticipantStatus.Disconnected,
                    callbackEvent.Reason, callbackEvent);

            return Task.CompletedTask;
        }
    }
}
