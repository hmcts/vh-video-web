using System.Collections.Generic;
using FluentAssertions;
using VideoWeb.AcceptanceTests.Pages;
using TestApi.Contract.Enums;

namespace VideoWeb.AcceptanceTests.Journeys
{
    public class StaffMemberJourney : IJourney
    {
        public List<Page> Journey()
        {
            return new List<Page>()
            {
                Page.Login,
                Page.StaffMemberHearingList,
                Page.StaffMemberWaitingRoomPage,
                Page.HearingRoom
            };
        }

        public void VerifyUserIsApplicableToJourney(UserType userType)
        {
            userType.Should().Be(UserType.StaffMember);
        }

        public void VerifyDestinationIsInThatJourney(Page destinationPage)
        {
            Journey().Should().Contain(destinationPage);
        }
    }
}
