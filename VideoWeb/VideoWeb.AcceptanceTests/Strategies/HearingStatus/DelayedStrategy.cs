using System;
using VideoWeb.AcceptanceTests.Contexts;
using VideoWeb.AcceptanceTests.Steps;

namespace VideoWeb.AcceptanceTests.Strategies.HearingStatus
{
    public class DelayedStrategy : IHearingStatusStrategies
    {
        public void Execute(TestContext context, Guid participantId)
        {
            var dataSetupSteps = new DataSetupSteps(context);
            dataSetupSteps.GivenIHaveAHearingAndAConferenceInMinutesTime(-10);
        }
    }
}
