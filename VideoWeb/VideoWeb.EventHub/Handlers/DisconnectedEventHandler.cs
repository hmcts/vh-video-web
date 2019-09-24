using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using VideoWeb.EventHub.Enums;
using VideoWeb.EventHub.Handlers.Core;
using VideoWeb.EventHub.Hub;
using VideoWeb.EventHub.Models;

namespace VideoWeb.EventHub.Handlers
{
    public class DisconnectedEventHandler : EventHandlerBase
    {
        public DisconnectedEventHandler(IHubContext<Hub.EventHub, IEventHubClient> hubContext) : base(hubContext)
        {
        }

        public override EventType EventType => EventType.Disconnected;

        protected override async Task PublishStatusAsync(CallbackEvent callbackEvent)
        {
            await PublishParticipantDisconnectMessage().ConfigureAwait(false);
            if (SourceParticipant.IsJudge()) await PublishSuspendedEventMessage().ConfigureAwait(false);
        }

        private async Task PublishParticipantDisconnectMessage()
        {
            var participantState = ParticipantState.Disconnected;
            await PublishParticipantStatusMessage(participantState).ConfigureAwait(false);

            //await AddDisconnectedTask().ConfigureAwait(false);
        }

        //private async Task AddDisconnectedTask()
        //{
        //    var taskType = SourceParticipant.IsJudge() ? TaskType.Judge : TaskType.Participant;
        //    var disconnected = new AddTaskCommand(SourceConference.Id, SourceParticipant.Id, "Disconnected", taskType);
        //    await CommandHandler.Handle(disconnected).ConfigureAwait(false);
        //}

        //private async Task AddSuspendedTask()
        //{
        //    var addSuspendedTask =
        //        new AddTaskCommand(SourceConference.Id, SourceConference.Id, "Suspended", TaskType.Hearing);
        //    await CommandHandler.Handle(addSuspendedTask).ConfigureAwait(false);
        //}

        private async Task PublishSuspendedEventMessage()
        {
            var conferenceState = ConferenceState.Suspended;
            await PublishConferenceStatusMessage(conferenceState).ConfigureAwait(false);
            
            //var updateConferenceStatusCommand =
            //    new UpdateConferenceStatusCommand(SourceConference.Id, conferenceState);
            //await CommandHandler.Handle(updateConferenceStatusCommand).ConfigureAwait(false);

            //await AddSuspendedTask().ConfigureAwait(false);
        }
    }
}