using VideoWeb.AcceptanceTests.Contexts;

namespace VideoWeb.AcceptanceTests.Strategies
{
    public interface IHearingStatusStrategies
    {
        void Execute(TestContext context, string participantId);
    }
}
