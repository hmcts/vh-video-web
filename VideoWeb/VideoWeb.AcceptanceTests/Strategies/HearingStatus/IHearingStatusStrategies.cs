using System;
using VideoWeb.AcceptanceTests.Helpers;

namespace VideoWeb.AcceptanceTests.Strategies.HearingStatus
{
    public interface IHearingStatusStrategies
    {
        void Execute(TestContext context, Guid participantId);
    }
}
