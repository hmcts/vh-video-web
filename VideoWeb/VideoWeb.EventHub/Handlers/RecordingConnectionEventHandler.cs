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
            var conferenceId = SourceConference.Id;

            var participantId = callbackEvent.ParticipantId;

            var message = $"Recording Connection Failed: Conference Id: {conferenceId} - Participant id: {participantId}";
            Logger.LogTrace(
                message: message);

            await HubContext.Clients.Group(Hub.EventHub.VhOfficersGroupName)
                .RecordingConnectionFailed(conferenceId, participantId);

        }
    }
}
