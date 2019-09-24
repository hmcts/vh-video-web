using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using VideoWeb.EventHub.Enums;
using VideoWeb.EventHub.Handlers.Core;
using VideoWeb.EventHub.Hub;
using VideoWeb.EventHub.Models;

namespace VideoWeb.EventHub.Handlers
{
    public class SelfTestFailedEventHandler : EventHandlerBase
    {
        public SelfTestFailedEventHandler(IHubContext<Hub.EventHub, IEventHubClient> hubContext) : base(hubContext)
        {
        }

        public override EventType EventType => EventType.SelfTestFailed;

        protected override Task PublishStatusAsync(CallbackEvent callbackEvent)
        {
            /**
            var query = new GetTasksForConferenceQuery(SourceConference.Id);
            var tasks = await QueryHandler.Handle<GetTasksForConferenceQuery, List<Domain.Task>>(query);
            var task = tasks.SingleOrDefault(x => x.Type == TaskType.Participant 
                && x.OriginId == SourceParticipant.Id && x.Status == TaskStatus.ToDo && x.Body == callbackEvent.Reason);
            if (task == null)
            {
                var command = new AddTaskCommand(SourceConference.Id, SourceParticipant.Id,
                    callbackEvent.Reason, TaskType.Participant);
                await CommandHandler.Handle(command);
            }
            **/
            return Task.CompletedTask;
            ;
        }
    }
}
