using System;
using VideoWeb.AcceptanceTests.Helpers;

namespace VideoWeb.AcceptanceTests.Strategies.ParticipantStatus
{
    public interface IParticipantStatusStrategy
    {
        void Execute(TestContext context, Guid participantId);
    }
}
