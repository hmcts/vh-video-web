using System.Collections.Generic;
using VideoWeb.AcceptanceTests.Pages;
using VideoWeb.Services.TestApi;

namespace VideoWeb.AcceptanceTests.Journeys
{
    public interface IJourney
    {
        List<Page> Journey();
        void VerifyDestinationIsInThatJourney(Page destinationPage);
        void VerifyUserIsApplicableToJourney(UserType userType);
    }
}
