using System;
using System.Collections.Generic;
using System.Linq;
using FluentAssertions;
using TechTalk.SpecFlow;
using VideoWeb.AcceptanceTests.Contexts;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.AcceptanceTests.Pages;
using VideoWeb.AcceptanceTests.Users;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public class VhoHearingListSteps : ISteps
    {
        private readonly Dictionary<string, UserBrowser> _browsers;
        private readonly TestContext _tc;
        private readonly VhoHearingListPage _vhoPage;
        private readonly AdminPanelPage _adminPanelPage;

        public VhoHearingListSteps(Dictionary<string, UserBrowser> browsers, TestContext testContext, VhoHearingListPage vhoPage, AdminPanelPage adminPanelPage)
        {
            _browsers = browsers;
            _tc = testContext;
            _vhoPage = vhoPage;
            _adminPanelPage = adminPanelPage;
        }

        [When(@"the VHO selects the hearing")]
        public void ProgressToNextPage()
        {
            _browsers[_tc.CurrentUser.Key].Driver
                .WaitUntilVisible(
                    _vhoPage.VideoHearingsOfficerSelectHearingButton(_tc.Hearing.Cases.First().Number))
                .Click();
;
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_adminPanelPage.ParticipantStatusTable, 60).Displayed.Should().BeTrue();
        }

        [Then(@"the VHO can see a list of hearings including the new hearing")]
        public void ThenTheVhoCanSeeAListOfHearingsIncludingTheNewHearing()
        {
            if (_tc.Hearing.Scheduled_duration == null)
            {
                throw new DataMisalignedException("Duration cannot be null");
            }

            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_vhoPage.HearingWithCaseNumber(_tc.Hearing.Cases.First().Number)).Displayed
                .Should().BeTrue();

            var timespan = TimeSpan.FromMinutes(_tc.Hearing.Scheduled_duration.Value);
            var listedFor = GetListedForTimeAsString(timespan);

            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_vhoPage.VideoHearingsOfficerTime(_tc.Hearing.Cases.First().Number)).Text
                .Should().Be($"{_tc.Hearing.Scheduled_date_time?.ToLocalTime():HH:mm}");

            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_vhoPage.VideoHearingsOfficerListedFor(_tc.Hearing.Cases.First().Number)).Text
                .Should().Be($"{listedFor}");
        }

        [Then(@"the VHO can see the hearing view")]
        public void ThenTheVhoCanSeeTheHearingView()
        {
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_adminPanelPage.ParticipantStatusTable, 60).Displayed.Should().BeTrue();
        }

        [Then(@"the VHO should see the participant contact details")]
        public void ThenTheVhoShouldSeeTheParticipantContactDetails()
        {
            var hearingParticipants = _tc.Hearing.Participants.FindAll(x =>
                x.User_role_name.Equals("Individual") || x.User_role_name.Equals("Representative"));

            var user = hearingParticipants.First().Last_name;

            var hearingParticipant = hearingParticipants.First();

            var firstParticipantLink = _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_vhoPage.ParticipantName(hearingParticipant.Last_name));
            firstParticipantLink.Displayed.Should().BeTrue();

            var action = new OpenQA.Selenium.Interactions.Actions(_browsers[_tc.CurrentUser.Key].Driver.WrappedDriver);
            action.MoveToElement(firstParticipantLink).Perform();

            var conferenceParticipant = _tc.Conference.Participants.Find(x => x.Name.Contains(user));
            var participantEmailAndRole = $"{conferenceParticipant.Name} ({conferenceParticipant.Case_type_group})";

            _browsers[_tc.CurrentUser.Key].Driver
                .WaitUntilVisible(_vhoPage.ParticipantContactDetails(user, participantEmailAndRole)).Displayed
                .Should().BeTrue();

            _browsers[_tc.CurrentUser.Key].Driver
                .WaitUntilVisible(_vhoPage.ParticipantContactDetails(user, hearingParticipant.Contact_email)).Displayed
                .Should().BeTrue();

            _browsers[_tc.CurrentUser.Key].Driver
                .WaitUntilVisible(_vhoPage.ParticipantContactDetails(user, hearingParticipant.Telephone_number)).Displayed
                .Should().BeTrue();
        }

        private static string GetListedForTimeAsString(TimeSpan timespan)
        {
            var listedFor = "";

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
                listedFor = listedFor + $" and 1 minute";
            }
            else
            {
                listedFor = listedFor + $" and {timespan.Minutes} minutes";
            }

            return listedFor;
        }
    }
}
