using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using EventType = VideoWeb.EventHub.Enums.EventType;

namespace VideoWeb.EventHub.Handlers
{
    public class RecordingConnectionEventHandler(
        IHubContext<Hub.EventHubVIH11189, IEventHubClient> hubContext,
        IConferenceService conferenceService,
        ILogger<EventHandlerBase> logger)
        : EventHandlerBase(hubContext, conferenceService, logger)
    {

        public override EventType EventType => EventType.RecordingConnectionFailed;

        protected override async Task PublishStatusAsync(CallbackEvent callbackEvent)
        {
            var conferenceId = SourceConference.Id;

            var participantId = callbackEvent.ParticipantId;

            Logger.LogTrace("Recording Connection Failed: Conference Id: {ConferenceId} - Participant id: {ParticipantId}", conferenceId, participantId);

            await HubContext.Clients.Group(Hub.EventHubVIH11189.VhOfficersGroupName)
                .RecordingConnectionFailed(conferenceId, participantId);

        }
    }
}
