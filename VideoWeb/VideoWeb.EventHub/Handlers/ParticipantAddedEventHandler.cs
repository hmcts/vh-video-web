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
using VideoWeb.Contract.Responses;

namespace VideoWeb.EventHub.Handlers
{
    public class ParticipantAddedEventHandler : EventHandlerBase
    {
        public ParticipantAddedEventHandler(IHubContext<Hub.EventHub, IEventHubClient> hubContext,
            IConferenceCache conferenceCache, ILogger<EventHandlerBase> logger, IVideoApiClient videoApiClient) : base(
            hubContext, conferenceCache, logger, videoApiClient)
        {
        }

        public override EventType EventType => EventType.ParticipantAdded;

        protected override Task PublishStatusAsync(CallbackEvent callbackEvent)
        {
            // var participantAdded = SourceConference.Participants.Find(participant => participant.Id == callbackEvent.ParticipantId);
            var participantAdded = callbackEvent.ParticipantAdded;
            var participantResponse = new ParticipantResponse() { DisplayName = participantAdded.DisplayName, Role = participantAdded.Role, HearingRole = participantAdded.HearingRole };
            return PublishParticipantAddedMessage(participantResponse);
        }
    }
}
