using AcceptanceTests.Common.Driver.Drivers;
using AcceptanceTests.Common.Driver.Helpers;
using FluentAssertions;
using System.Collections.Generic;
using System.Linq;
using TechTalk.SpecFlow;
using TestApi.Contract.Dtos;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.AcceptanceTests.Pages;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public sealed class LastMinuteBookingSteps
    {
        private readonly Dictionary<UserDto, UserBrowser> _browsers;
        private readonly TestContext _c;

        public LastMinuteBookingSteps(Dictionary<UserDto, UserBrowser> browsers, TestContext testContext)
        {
            _browsers = browsers;
            _c = testContext;
        }

        [Then("the participant in the waiting room must see the toast alert")]
        public void ThenTheParticipantInTheWaitingRoomMustSeeToastAlert()
        {
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(WaitingRoomPage.ToastAlert).Displayed.Should().BeTrue();
            var particpantElement = _browsers[_c.CurrentUser].Driver.FindElements(WaitingRoomPage.Heading).ToList().Where(element => element.Text.Contains("Observers"));

            particpantElement.Count().Should().Be(1);
        }
    }
}
