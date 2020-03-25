using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoWeb.EventHub.Enums;
using VideoWeb.EventHub.Handlers.Core;
using VideoWeb.EventHub.Hub;
using VideoWeb.EventHub.Models;

namespace VideoWeb.EventHub.Handlers
{
    public class ParticipantJoiningEventHandler : EventHandlerBase
    {
        public ParticipantJoiningEventHandler(IHubContext<Hub.EventHub, IEventHubClient> hubContext, IConferenceCache conferenceCache, ILogger<EventHandlerBase> logger) : base(hubContext, conferenceCache, logger)
        {
        }

        public override EventType EventType => EventType.ParticipantJoining;

        public override async Task HandleAsync(CallbackEvent callbackEvent)
        {
            SourceConference = new Conference
            {
                Id = callbackEvent.ConferenceId,
                Participants = new List<Participant>()
            };
            SourceParticipant = new Participant {Id = callbackEvent.ParticipantId};
            await PublishStatusAsync(callbackEvent);
        }

        protected override async Task PublishStatusAsync(CallbackEvent callbackEvent)
        {
            var participantState = ParticipantState.Joining;
            await PublishParticipantStatusMessage(participantState);
        }
    }
}
