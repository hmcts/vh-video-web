using System.Collections.Generic;
using FluentAssertions;
using VideoWeb.AcceptanceTests.Pages;

namespace VideoWeb.AcceptanceTests.Journeys
{
    public class ClerkJourney : IJourney
    {
        public List<Page> Journey()
        {
            return new List<Page>()
            {
                Page.Login,
                Page.HearingList,
                Page.WaitingRoom,
                Page.HearingRoom
            };
        }

        public void VerifyUserIsApplicableToJourney(string currentUserRole)
        {
            currentUserRole.ToLower().Should().BeOneOf("clerk", "judge");
        }

        public void VerifyDestinationIsInThatJourney(Page destinationPage)
        {
            Journey().Should().Contain(destinationPage);
        }
    }
}
