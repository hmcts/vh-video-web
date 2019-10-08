using System;
using VideoWeb.AcceptanceTests.Builders;
using VideoWeb.AcceptanceTests.Contexts;
using VideoWeb.EventHub.Enums;

namespace VideoWeb.AcceptanceTests.Strategies.ParticipantStatus
{
    internal class JoiningStrategy : IParticipantStatusStrategy
    {
        public void Execute(TestContext context, Guid participantId)
        {
            var request = new CallbackEventRequestBuilder()
                .WithConferenceId(context.NewConferenceId)
                .WithParticipantId(participantId)
                .WithEventType(EventType.ParticipantJoining)
                .Build();

            new ExecuteEventBuilder()
                .WithContext(context)
                .WithRequest(request)
                .SendToVideoWeb();
        }
    }
}
