using VideoWeb.AcceptanceTests.Contexts;
using VideoWeb.AcceptanceTests.Steps;

namespace VideoWeb.AcceptanceTests.Actions
{
    public class DelayedAction : IHearingStatusActions
    {
        public void Execute(TestContext context, string participantId)
        {
            var dataSetupSteps = new DataSetupSteps(context);
            dataSetupSteps.GivenIHaveAHearingAndAConferenceInMinutesTime(-10);
        }
    }
}
