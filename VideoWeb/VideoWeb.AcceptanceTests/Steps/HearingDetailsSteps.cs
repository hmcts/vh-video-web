using System;
using System.Linq;
using FluentAssertions;
using TechTalk.SpecFlow;
using VideoWeb.AcceptanceTests.Contexts;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.AcceptanceTests.Pages;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public sealed class HearingDetailsSteps
    {
        private readonly BrowserContext _browserContext;
        private readonly TestContext _context;
        private readonly HearingListPage _hearingListPage;
        private const int TollerenceInMinutes = 2;
        private const int MinutesToWaitBeforeAllowedToJoinHearing = 30;

        public HearingDetailsSteps(BrowserContext browserContext, TestContext context,
            HearingListPage hearingListPage)
        {
            _browserContext = browserContext;
            _context = context;
            _hearingListPage = hearingListPage;
        }

        [Then(@"a warning message appears indicating the user has no hearings scheduled")]
        public void ThenAWarningMessageAppearsIndicatingTheUserHasNoHearingsScheduled()
        {
            _browserContext.NgDriver.WaitUntilElementVisible(_hearingListPage.NoHearingsWarningMessage).Displayed
                .Should().BeTrue();
        }

        [Then(@"the user can see a list of hearings including the new hearing")]
        public void ThenTheUserCanSeeAListOfHearingsIncludingTheNewHearing()
        {
            _browserContext.NgDriver.WaitUntilElementVisible(_hearingListPage._hearingWithCaseNumber(_context.Hearing.Cases.First().Number)).Displayed
                .Should().BeTrue();
        }

        [Then(@"contact us details are available")]
        public void ThenContactUsDetailsWillBeAvailable()
        {
            _browserContext.NgDriver.WaitUntilElementVisible(_hearingListPage.ContactUsLink).Displayed
                .Should().BeTrue();
            _hearingListPage.TheCaseNumberIsNotDisplayedInTheContactDetails().Should().BeTrue();
        }

        [Then(@"the new hearing isn't available to join yet")]
        public void ThenTheNewHearingIsnTAvailableToJoinYet()
        {
           var actualTime = _browserContext.NgDriver
                .WaitUntilElementVisible(_hearingListPage._waitToSignInText(_context.Hearing.Cases.First().Number))
                .Text;

            actualTime = actualTime.Substring(actualTime.Length - 5);

            var isWithinTimeframe = false;
            for (var i = -TollerenceInMinutes; i <= TollerenceInMinutes; i++)
            {
                if (!actualTime.Equals(DateTime.Now
                    .AddMinutes(_context.DelayedStartTime - MinutesToWaitBeforeAllowedToJoinHearing + i)
                    .ToString("HH:mm"))) continue;
                isWithinTimeframe = true;
                break;
            }
            isWithinTimeframe.Should().BeTrue();
        }

        [Then(@"when the hearing is ready to start the hearing button appears")]
        public void ThenWhenTheHearingIsReadyToStartTheHearingButtonAppears()
        {
            _browserContext.NgDriver.WaitUntilElementVisible(_hearingListPage._signInButton(_context.Hearing.Cases.First().Number), TollerenceInMinutes * 60).Displayed
                .Should().BeTrue();
        }

        [When(@"the user clicks the Start Hearing button")]
        public void WhenTheUserClicksTheStartButton()
        {
            _browserContext.NgDriver.WaitUntilElementVisible(_hearingListPage._signInButton(_context.Hearing.Cases.First().Number), TollerenceInMinutes * 60).Click();
        }
    }
}
