using VideoWeb.AcceptanceTests.Builders;
using VideoWeb.AcceptanceTests.Contexts;
using VideoWeb.Services.Video;

namespace VideoWeb.AcceptanceTests.Strategies.HearingStatus
{
    internal class InSessionStrategy : IHearingStatusStrategies
    {
        public void Execute(TestContext context, string participantId)
        {
            var request = new EventRequestBuilder()
                .WithConferenceId(context.NewConferenceId)
                .WithParticipantId(participantId)
                .WithEventType(EventType.Transfer)
                .FromRoomType(RoomType.WaitingRoom)
                .ToRoomType(RoomType.HearingRoom)
                .Build();

            new ExecuteEventBuilder()
                .WithContext(context)
                .WithRequest(request)
                .SendToVideoApi();

            request = new EventRequestBuilder()
                .WithConferenceId(context.NewConferenceId)
                .WithParticipantId(participantId)
                .WithEventType(EventType.Joined)
                .FromRoomType(null)
                .ToRoomType(null)
                .Build();

            new ExecuteEventBuilder()
                .WithContext(context)
                .WithRequest(request)
                .SendToVideoApi();
        }
    }
}