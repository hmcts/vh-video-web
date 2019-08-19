using VideoWeb.AcceptanceTests.Builders;
using VideoWeb.AcceptanceTests.Contexts;
using VideoWeb.Services.Video;

namespace VideoWeb.AcceptanceTests.Strategies
{
    internal class NotStartedStrategy : IHearingStatusStrategies
    {
        public void Execute(TestContext context, string participantId)
        {
            var request = new EventRequestBuilder()
                .WithConferenceId(context.NewConferenceId)
                .WithParticipantId(participantId)
                .WithEventType(EventType.JudgeAvailable)
                .Build();

            new ExecuteEventBuilder()
                .WithContext(context)
                .WithRequest(request)
                .Execute();
        }
    }
}