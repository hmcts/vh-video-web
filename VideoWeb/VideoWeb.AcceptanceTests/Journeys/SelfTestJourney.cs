using System.Collections.Generic;
using FluentAssertions;
using VideoWeb.AcceptanceTests.Pages;
using VideoWeb.Services.TestApi;

namespace VideoWeb.AcceptanceTests.Journeys
{

    public class SelfTestJourney : IJourney
    {
        public List<Page> Journey()
        {
            return new List<Page>()
            {
                Page.Login,
                Page.HearingList,
                Page.EquipmentCheck,
                Page.SwitchOnCamAndMic,
                Page.PracticeVideoHearing
            };
        }

        public void VerifyUserIsApplicableToJourney(UserType userType)
        {
            userType.ToString().ToLower().Should().BeOneOf("individual","representative");
        }

        public void VerifyDestinationIsInThatJourney(Page destinationPage)
        {
            Journey().Should().Contain(destinationPage);
        }
    }
}
