using VideoWeb.AcceptanceTests.Contexts;
using VideoWeb.AcceptanceTests.Steps;

namespace VideoWeb.AcceptanceTests.Strategies
{
    public class DelayedStrategy : IHearingStatusStrategies
    {
        public void Execute(TestContext context, string participantId)
        {
            var dataSetupSteps = new DataSetupSteps(context);
            dataSetupSteps.GivenIHaveAHearingAndAConferenceInMinutesTime(-10);
        }
    }
}
