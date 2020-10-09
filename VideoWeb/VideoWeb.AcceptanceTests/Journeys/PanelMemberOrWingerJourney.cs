using System.Collections.Generic;
using FluentAssertions;
using VideoWeb.AcceptanceTests.Pages;
using VideoWeb.Services.TestApi;

namespace VideoWeb.AcceptanceTests.Journeys
{
    public class PanelMemberOrWingerJourney : IJourney
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

        public void VerifyUserIsApplicableToJourney(UserType userType)
        {
            userType.ToString().Should().BeOneOf(UserType.PanelMember.ToString(), UserType.Winger.ToString());
        }

        public void VerifyDestinationIsInThatJourney(Page destinationPage)
        {
            Journey().Should().Contain(destinationPage);
        }
    }
}
