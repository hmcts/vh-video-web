using System.Collections.Generic;
using VideoWeb.AcceptanceTests.Pages;
using TestApi.Client;
using TestApi.Contract.Dtos;
using TestApi.Contract.Enums;
using TestApi.Contract.Enums;

namespace VideoWeb.AcceptanceTests.Journeys
{
    public interface IJourney
    {
        List<Page> Journey();
        void VerifyDestinationIsInThatJourney(Page destinationPage);
        void VerifyUserIsApplicableToJourney(UserType userType);
    }
}
