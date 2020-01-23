using System;
using VideoWeb.AcceptanceTests.Builders;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.EventHub.Enums;

namespace VideoWeb.AcceptanceTests.Strategies.HearingStatus
{
    internal class InSessionStrategy : IHearingStatusStrategies
    {
        public void Execute(TestContext context, Guid participantId)
        {
            var request = new CallbackEventRequestBuilder()
                .WithConferenceId(context.Test.NewConferenceId)
                .WithParticipantId(participantId)
                .WithEventType(EventType.Transfer)
                .FromRoomType(RoomType.WaitingRoom)
                .ToRoomType(RoomType.HearingRoom)
                .Build();

            new ExecuteEventBuilder()
                .WithContext(context)
                .WithRequest(request)
                .SendToVideoWeb();

            request = new CallbackEventRequestBuilder()
                .WithConferenceId(context.Test.NewConferenceId)
                .WithParticipantId(participantId)
                .WithEventType(EventType.Joined)
                .FromRoomType(null)
                .ToRoomType(null)
                .Build();

            new ExecuteEventBuilder()
                .WithContext(context)
                .WithRequest(request)
                .SendToVideoWeb();
        }
    }
}