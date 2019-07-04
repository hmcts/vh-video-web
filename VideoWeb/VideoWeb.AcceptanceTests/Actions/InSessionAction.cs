using VideoWeb.AcceptanceTests.Builders;
using VideoWeb.AcceptanceTests.Contexts;
using VideoWeb.Services.Video;

namespace VideoWeb.AcceptanceTests.Actions
{
    internal class InSessionAction : IHearingStatusActions
    {
        public void Execute(TestContext context, string participantId)
        {
            var request = new CreateEventRequestBuilder()
                .WithConferenceId(context.NewConferenceId)
                .WithParticipantId(participantId)
                .WithEventType(EventType.Transfer)
                .FromRoomType(RoomType.WaitingRoom)
                .ToRoomType(RoomType.HearingRoom)
                .Build();

            new ExecuteEventRequestBuilder()
                .WithContext(context)
                .WithRequest(request)
                .Execute();

            request = new CreateEventRequestBuilder()
                .WithConferenceId(context.NewConferenceId)
                .WithParticipantId(participantId)
                .WithEventType(EventType.Joined)
                .FromRoomType(null)
                .ToRoomType(null)
                .Build();

            new ExecuteEventRequestBuilder()
                .WithContext(context)
                .WithRequest(request)
                .Execute();
        }
    }
}