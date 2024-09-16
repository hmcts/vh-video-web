using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using EventType = VideoWeb.EventHub.Enums.EventType;

namespace VideoWeb.EventHub.Handlers
{
    public class RecordingConnectionEventHandler(
        IHubContext<Hub.EventHub, IEventHubClient> hubContext,
        IConferenceService conferenceService,
        ILogger<EventHandlerBase> logger)
        : EventHandlerBase(hubContext, conferenceService, logger)
    {

        public override EventType EventType => EventType.RecordingConnectionFailed;

        protected override async Task PublishStatusAsync(CallbackEvent callbackEvent)
        {
            var participant = SourceConference.Participants.Find(p => p.Id == callbackEvent.ParticipantId);
            var conferenceId = SourceConference.Id;

            if (participant != null)
            {
                var participantId = participant.Id;
                await HubContext.Clients.Group(participant.Username.ToLowerInvariant())
                    .RecordingConnectionFailed(conferenceId, participantId);
                Logger.LogTrace(
                    $"Recording Connection Failed: Conference Id: {SourceConference.Id} - Participant id: {participant.Id}");

            }
        }
    }
}
