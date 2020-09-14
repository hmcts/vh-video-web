using System.Collections.Generic;
using System.Linq;
using System.Net;
using AcceptanceTests.Common.Api.Helpers;
using FluentAssertions;
using VideoWeb.Services.TestApi;
using EventType = VideoWeb.EventHub.Enums.EventType;

namespace VideoWeb.AcceptanceTests.Helpers
{
    public static class Tasks
    {
        public static void GetTheTaskId(TestContext context, EventType eventType)
        {
            var response = context.Apis.TestApi.GetTasks(context.Test.NewConferenceId);
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            var tasks = RequestHelper.Deserialise<List<TaskResponse>>(response.Content);
            var taskType = EventTypeToTaskTypeMapper(eventType);
            if (tasks.Any(x => x.Body.Contains(taskType)))
            {
                context.Test.TaskId = tasks.First(x => x.Body.Contains(taskType)).Id;
            }
        }

        private static string EventTypeToTaskTypeMapper(EventType eventType)
        {
            if (eventType == EventType.MediaPermissionDenied)
                return "Media blocked";
            if (eventType == EventType.Suspend)
                return "Hearing suspended";
            if (eventType == EventType.SelfTestFailed)
                return "Failed self-test";
            return eventType.ToString();
        }

        public static void TasksListShouldBeEmpty(TestContext context)
        {
            var response = context.Apis.TestApi.GetTasks(context.Test.NewConferenceId);
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            var tasks = RequestHelper.Deserialise<List<TaskResponse>>(response.Content);
            tasks.Count.Should().Be(0);
        }
    }
}
