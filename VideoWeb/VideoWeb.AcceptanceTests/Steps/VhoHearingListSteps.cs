using System;
using System.Collections.Generic;
using System.Linq;
using AcceptanceTests.Common.Driver.Drivers;
using AcceptanceTests.Common.Driver.Enums;
using AcceptanceTests.Common.Driver.Helpers;
using FluentAssertions;
using OpenQA.Selenium.Interactions;
using TechTalk.SpecFlow;
using VideoWeb.AcceptanceTests.Data;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.AcceptanceTests.Pages;
using VideoWeb.Services.TestApi;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public class VhoHearingListSteps : ISteps
    {
        private readonly Dictionary<User, UserBrowser> _browsers;
        private readonly TestContext _c;

        public VhoHearingListSteps(Dictionary<User, UserBrowser> browsers, TestContext testContext)
        {
            _browsers = browsers;
            _c = testContext;
        }

        [When(@"the VHO selects the hearing")]
        public void ProgressToNextPage()
        {
            Scrolling.ScrollToTheHearing(_browsers[_c.CurrentUser], _c.Test.Conference.Id);
            _browsers[_c.CurrentUser].Click(VhoHearingListPage.SelectHearingButton(_c.Test.Conference.Id));
            Scrolling.ScrollToTheTopOfThePage(_browsers[_c.CurrentUser]);
            _browsers[_c.CurrentUser].Click(VhoHearingListPage.HearingsTabButton);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(AdminPanelPage.ParticipantStatusTable, 60).Displayed.Should().BeTrue();
        }

        [Then(@"the VHO can see a list of hearings including the new hearing")]
        public void ThenTheVhoCanSeeAListOfHearingsIncludingTheNewHearing()
        {
            Scrolling.ScrollToTheHearing(_browsers[_c.CurrentUser], _c.Test.Conference.Id);

            var hearingThatShouldBeVisible = _c.Test.Conferences.First();

            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(VhoHearingListPage.CaseName(hearingThatShouldBeVisible.Id)).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(VhoHearingListPage.CaseNumber(hearingThatShouldBeVisible.Id)).Displayed.Should().BeTrue();
            var timespan = TimeSpan.FromMinutes(hearingThatShouldBeVisible.Scheduled_duration);
            var listedFor = DateTimeToString.GetListedForTimeAsString(timespan);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(VhoHearingListPage.HearingTime(hearingThatShouldBeVisible.Id)).Text.Trim()
                .Should().Be($"{_c.TimeZone.Adjust(hearingThatShouldBeVisible.Scheduled_date_time):HH:mm}");
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(VhoHearingListPage.ListedFor(hearingThatShouldBeVisible.Id)).Text.Trim()
                .Should().Be($"{listedFor}");
            Scrolling.ScrollToTheTopOfThePage(_browsers[_c.CurrentUser]);
        }

        [Then(@"the VHO can see the hearing view")]
        public void ThenTheVhoCanSeeTheHearingView()
        {
            Scrolling.ScrollToTheTopOfThePage(_browsers[_c.CurrentUser]);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(AdminPanelPage.ParticipantStatusTable, 60).Displayed.Should().BeTrue();
        }

        [Then(@"the VHO should see the participant contact details")]
        public void ThenTheVhoShouldSeeTheParticipantContactDetails()
        {
            Scrolling.ScrollToTheTopOfThePage(_browsers[_c.CurrentUser]);
            var hearingParticipants = _c.Test.HearingParticipants.FindAll(x => x.User_role_name.Equals("Individual") || x.User_role_name.Equals("Representative"));
            var hearingParticipant = hearingParticipants.First();
            var conferenceParticipant = _c.Test.ConferenceParticipants.Find(x => x.Name.Contains(hearingParticipant.Last_name));
            var firstParticipantLink = _browsers[_c.CurrentUser].Driver.WaitUntilVisible(VhoHearingListPage.ParticipantContactLink(conferenceParticipant.Id));
            firstParticipantLink.Displayed.Should().BeTrue();
            var action = new Actions(_browsers[_c.CurrentUser].Driver.WrappedDriver);
            action.MoveToElement(firstParticipantLink).Perform();
            if (_c.VideoWebConfig.TestConfig.TargetBrowser == TargetBrowser.Safari) return; // Latest version of Safari Driver will not hover over the correct element
            TheToolTipDetailsAreDisplayed(conferenceParticipant, hearingParticipant);
        }

        private void TheToolTipDetailsAreDisplayed(ParticipantDetailsResponse participant, ParticipantResponse hearingParticipant)
        {
            var participantEmailAndRole = $"{participant.Name} ({participant.Case_type_group})";
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(VhoHearingListPage.ParticipantContactName(participant.Id)).Text.Trim().Should().Be(participantEmailAndRole);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(VhoHearingListPage.ParticipantContactEmail(participant.Id)).Text.Trim().Should().Be(hearingParticipant.Contact_email);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(VhoHearingListPage.ParticipantContactPhone(participant.Id)).Text.Trim().Should().Be(hearingParticipant.Telephone_number);
        }
    }
}
