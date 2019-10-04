using VideoWeb.AcceptanceTests.Builders;
using VideoWeb.AcceptanceTests.Contexts;
using VideoWeb.Services.Video;

namespace VideoWeb.AcceptanceTests.Strategies.ParticipantStatus
{
    internal class JoiningStrategy : IParticipantStatusStrategy
    {
        public void Execute(TestContext context, string participantId)
        {
            var request = new EventRequestBuilder()
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
