using System;
using VideoWeb.AcceptanceTests.Builders;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.EventHub.Enums;

namespace VideoWeb.AcceptanceTests.Strategies.ParticipantStatus
{
    internal class DisconnectedStrategy : IParticipantStatusStrategy
    {
        public void Execute(TestContext context, Guid participantId)
        {
            var request = new CallbackEventRequestBuilder()
                .WithConferenceId(context.Test.NewConferenceId)
                .WithParticipantId(participantId)
                .WithEventType(EventType.Disconnected)
                .Build();

            new ExecuteEventBuilder()
                .WithContext(context)
                .WithRequest(request)
                .SendToVideoWeb();
        }
    }
}
