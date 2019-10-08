using System;
using VideoWeb.AcceptanceTests.Builders;
using VideoWeb.AcceptanceTests.Contexts;
using VideoWeb.EventHub.Enums;

namespace VideoWeb.AcceptanceTests.Strategies.ParticipantStatus
{
    internal class InHearingStrategy : IParticipantStatusStrategy
    {
        public void Execute(TestContext context, Guid participantId)
        {
            var request = new CallbackEventRequestBuilder()
                .WithConferenceId(context.NewConferenceId)
                .WithParticipantId(participantId)
                .WithEventType(EventType.Transfer)
                .ToRoomType(RoomType.HearingRoom)
                .Build();

            new ExecuteEventBuilder()
                .WithContext(context)
                .WithRequest(request)
                .SendToVideoWeb();
        }
    }
}
