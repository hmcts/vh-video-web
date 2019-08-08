using System.Collections.Generic;
using FluentAssertions;
using VideoWeb.AcceptanceTests.Pages;

namespace VideoWeb.AcceptanceTests.Journeys
{
    public class VhoJourney : IJourney
    {
        public List<Page> Journey()
        {
            return new List<Page>()
            {
                Page.Login,
                Page.VhoHearingList,
                Page.AdminPanel
            };
        }

        public void VerifyUserIsApplicableToJourney(string currentUserRole)
        {
            currentUserRole.ToLower().Should().BeOneOf("video hearings officer");
        }

        public void VerifyDestinationIsInThatJourney(Page destinationPage)
        {
            Journey().Should().Contain(destinationPage);
        }
    }
}
