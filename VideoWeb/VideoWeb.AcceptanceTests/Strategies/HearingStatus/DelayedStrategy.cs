using System;
using VideoWeb.AcceptanceTests.Helpers;

namespace VideoWeb.AcceptanceTests.Strategies.HearingStatus
{
    public class DelayedStrategy : IHearingStatusStrategies
    {
        public void Execute(TestContext context, Guid participantId)
        {
            // Deliberately Empty
        }
    }
}
