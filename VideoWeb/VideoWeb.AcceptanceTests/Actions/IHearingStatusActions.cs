using VideoWeb.AcceptanceTests.Contexts;

namespace VideoWeb.AcceptanceTests.Actions
{
    public interface IHearingStatusActions
    {
        void Execute(TestContext context, string participantId);
    }
}
