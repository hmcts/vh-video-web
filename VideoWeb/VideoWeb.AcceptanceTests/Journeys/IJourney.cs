using System.Collections.Generic;
using VideoWeb.AcceptanceTests.Pages;

namespace VideoWeb.AcceptanceTests.Journeys
{
    public interface IJourney
    {
        List<Page> Journey();
        void VerifyDestinationIsInThatJourney(Page destinationPage);
        void VerifyUserIsApplicableToJourney(string currentUserRole);
    }
}
