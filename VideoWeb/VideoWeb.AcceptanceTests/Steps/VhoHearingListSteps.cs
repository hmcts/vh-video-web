using System;
using System.Collections.Generic;
using System.Linq;
using AcceptanceTests.Common.Driver.Browser;
using AcceptanceTests.Common.Driver.Helpers;
using FluentAssertions;
using TechTalk.SpecFlow;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.AcceptanceTests.Pages;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public class VhoHearingListSteps : ISteps
    {
        private readonly Dictionary<string, UserBrowser> _browsers;
        private readonly TestContext _c;

        public VhoHearingListSteps(Dictionary<string, UserBrowser> browsers, TestContext testContext)
        {
            _browsers = browsers;
            _c = testContext;
        }

        [When(@"the VHO selects the hearing")]
        public void ProgressToNextPage()
        {
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(VhoHearingListPage.VideoHearingsOfficerSelectHearingButton(_c.Test.Case.Number)).Click();
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(AdminPanelPage.ParticipantStatusTable, 60).Displayed.Should().BeTrue();
        }

        [Then(@"the VHO can see a list of hearings including the new hearing")]
        public void ThenTheVhoCanSeeAListOfHearingsIncludingTheNewHearing()
        {
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(HearingListPage.HearingWithCaseNumber(_c.Test.Case.Number)).Displayed.Should().BeTrue();
            var timespan = TimeSpan.FromMinutes(_c.Test.Hearing.Scheduled_duration);
            var listedFor = GetListedForTimeAsString(timespan);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(VhoHearingListPage.VideoHearingsOfficerTime(_c.Test.Case.Number)).Text
                .Should().Be($"{_c.Test.Hearing.Scheduled_date_time.ToLocalTime():HH:mm}");
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(VhoHearingListPage.VideoHearingsOfficerListedFor(_c.Test.Case.Number)).Text
                .Should().Be($"{listedFor}");
        }

        [Then(@"the VHO can see the hearing view")]
        public void ThenTheVhoCanSeeTheHearingView()
        {
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(AdminPanelPage.ParticipantStatusTable, 60).Displayed.Should().BeTrue();
        }

        [Then(@"the VHO should see the participant contact details")]
        public void ThenTheVhoShouldSeeTheParticipantContactDetails()
        {
            var hearingParticipants = _c.Test.Hearing.Participants.FindAll(x => x.User_role_name.Equals("Individual") || x.User_role_name.Equals("Representative"));
            var user = hearingParticipants.First().Last_name;
            var hearingParticipant = hearingParticipants.First();
            var firstParticipantLink = _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(HearingListPage.ParticipantName(hearingParticipant.Last_name));
            firstParticipantLink.Displayed.Should().BeTrue();
            var action = new OpenQA.Selenium.Interactions.Actions(_browsers[_c.CurrentUser.Key].Driver.WrappedDriver);
            action.MoveToElement(firstParticipantLink).Perform();
            var conferenceParticipant = _c.Test.Conference.Participants.Find(x => x.Name.Contains(user));
            var participantEmailAndRole = $"{conferenceParticipant.Name} ({conferenceParticipant.Case_type_group})";
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(HearingListPage.ParticipantContactDetails(user, participantEmailAndRole)).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(HearingListPage.ParticipantContactDetails(user, hearingParticipant.Contact_email)).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(HearingListPage.ParticipantContactDetails(user, hearingParticipant.Telephone_number)).Displayed.Should().BeTrue();
        }

        private static string GetListedForTimeAsString(TimeSpan timespan)
        {
            string listedFor;

            if (timespan.Hours.Equals(0))
            {
                listedFor = timespan.Minutes.Equals(1) ? $"{timespan.Minutes} minute" : $"{timespan.Minutes} minutes";
            }
            else
            {
                listedFor = timespan.Hours.Equals(1) ? $"{timespan.Hours} hour" : $"{timespan.Hours} hours";
            }

            if (timespan.Minutes.Equals(0) || timespan.Hours <= 0) return listedFor;
            if (timespan.Minutes.Equals(1))
            {
                listedFor += $" and 1 minute";
            }
            else
            {
                listedFor += $" and {timespan.Minutes} minutes";
            }

            return listedFor;
        }
    }
}
