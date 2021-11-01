using System.Collections.Generic;
using FluentAssertions;
using VideoWeb.AcceptanceTests.Pages;
using TestApi.Contract.Enums;

namespace VideoWeb.AcceptanceTests.Journeys
{
    public class StaffMemberSelfTestJourney : IJourney
    {
        public List<Page> Journey()
        {
            return new List<Page>()
            {
                Page.Login,
                Page.StaffMemberHearingList,
                Page.EquipmentCheck,
                Page.SwitchOnCamAndMic,
                Page.PracticeVideoHearing
            };
        }

        public void VerifyUserIsApplicableToJourney(UserType userType)
        {
            userType.Should().Be(UserType.Judge);
        }

        public void VerifyDestinationIsInThatJourney(Page destinationPage)
        {
            Journey().Should().Contain(destinationPage);
        }
    }
}
