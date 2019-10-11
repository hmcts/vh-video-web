using System;
using VideoWeb.AcceptanceTests.Contexts;

namespace VideoWeb.AcceptanceTests.Strategies.HearingStatus
{
    public interface IHearingStatusStrategies
    {
        void Execute(TestContext context, Guid participantId);
    }
}
