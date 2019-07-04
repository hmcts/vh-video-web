using System;
using System.Diagnostics;
using System.Linq;
using FluentAssertions;
using OpenQA.Selenium;
using OpenQA.Selenium.Interactions;
using TechTalk.SpecFlow;
using Testing.Common.Builders;
using VideoWeb.AcceptanceTests.Contexts;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.AcceptanceTests.Pages;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public sealed class HearingsListSteps
    {
        private readonly BrowserContext _browserContext;
        private readonly TestContext _context;
        private readonly HearingListPage _hearingListPage;
        private const int TollerenceInMinutes = 3;
        private const int MinutesToWaitBeforeAllowedToJoinHearing = 30;

        public HearingsListSteps(BrowserContext browserContext, TestContext context,
            HearingListPage hearingListPage)
        {
            _browserContext = browserContext;
            _context = context;
            _hearingListPage = hearingListPage;
        }

        [When(@"the user clicks on the Start Hearing button")]
        public void WhenTheUserClicksTheStartButton()
        {
            var element = _context.CurrentUser.Role.Equals("Judge") ? _hearingListPage._startHearingButton(_context.Hearing.Cases.First().Number) : _hearingListPage._signInButton(_context.Hearing.Cases.First().Number);
            var tollerence = _context.CurrentUser.Role.Equals("Judge") ? 30 : TollerenceInMinutes * 60;
            _browserContext.NgDriver.WaitUntilElementVisible(element, tollerence).Click();
        }

        [When(@"the VHO selects the hearing")]
        public void WhenTheVhoSelectsTheHearing()
        {
            _browserContext.NgDriver
                .WaitUntilElementVisible(
                    _hearingListPage.VideoHearingsOfficerSelectHearingButton(_context.Hearing.Cases.First().Number))
                .Click();

            _browserContext.NgDriver.WaitUntilElementVisible(_hearingListPage.AdminIframe).Displayed.Should().BeTrue();
            _browserContext.NgDriver.SwitchTo().Frame(HearingListPage.AdminIframeId);
            _browserContext.NgDriver.WaitUntilElementVisible(_hearingListPage.WaitingRoomText).Displayed.Should().BeTrue();
        }

        [Then(@"a warning message appears indicating the user has no hearings scheduled")]
        public void ThenAWarningMessageAppearsIndicatingTheUserHasNoHearingsScheduled()
        {
            _browserContext.NgDriver.WaitUntilElementVisible(_hearingListPage.NoHearingsWarningMessage).Displayed
                .Should().BeTrue();
        }

        [Then(@"the participant can see a list of hearings including the new hearing")]
        public void ThenTheParticipantCanSeeAListOfHearingsIncludingTheNewHearing()
        {
            _browserContext.NgDriver.WaitUntilElementVisible(_hearingListPage._hearingWithCaseNumber(_context.Hearing.Cases.First().Number)).Displayed
                .Should().BeTrue();

            _browserContext.NgDriver.WaitUntilElementVisible(_hearingListPage.ParticipantHearingDate(_context.Hearing.Cases.First().Number)).Text
                .Should().Be(
                    $"{_context.Hearing.Scheduled_date_time?.ToString(DateFormats.HearingListPageDate)}");

            _browserContext.NgDriver.WaitUntilElementVisible(_hearingListPage.ParticipantHearingTime(_context.Hearing.Cases.First().Number)).Text
                .Should().Be(
                    $"{_context.Hearing.Scheduled_date_time?.ToLocalTime():HH:mm}");
        }

        [Then(@"the Judge can see a list of hearings including the new hearing")]
        public void ThenTheJudgeCanSeeAListOfHearingsIncludingTheNewHearing()
        {
            _browserContext.NgDriver.WaitUntilElementVisible(_hearingListPage._hearingWithCaseNumber(_context.Hearing.Cases.First().Number)).Displayed
                .Should().BeTrue();

            Debug.Assert(_context.Hearing.Scheduled_duration != null, "_context.Hearing.Scheduled_duration != null");
            var timespan = TimeSpan.FromMinutes(_context.Hearing.Scheduled_duration.Value);
            var listedFor = timespan.Hours.Equals(1) ? $"listed for {timespan.Hours} hour and {timespan.Minutes} minutes" : $"listed for {timespan.Hours} hours and {timespan.Minutes} minutes";

            _browserContext.NgDriver.WaitUntilElementVisible(_hearingListPage.JudgeHearingDate(_context.Hearing.Cases.First().Number)).Text
                .Should().Be(
                    $"{_context.Hearing.Scheduled_date_time?.ToString(DateFormats.HearingListPageDate)}");

            _browserContext.NgDriver.WaitUntilElementVisible(_hearingListPage.JudgeHearingTime(_context.Hearing.Cases.First().Number)).Text
                .Should().Be($"{_context.Hearing.Scheduled_date_time?.ToLocalTime():HH:mm}");

            _browserContext.NgDriver.WaitUntilElementVisible(_hearingListPage.JudgeHearingListedFor(_context.Hearing.Cases.First().Number)).Text
                .Should().Be($"{listedFor}");

            _browserContext.NgDriver.WaitUntilElementVisible(_hearingListPage.CaseType(_context.Hearing.Cases.First().Number, _context.Hearing.Case_type_name)).Displayed
                .Should().BeTrue();

            var count = _context.Hearing.Participants.Count(
                x => x.User_role_name.Equals("Individual") ||
                     x.User_role_name.Equals("Representative"));

            _browserContext.NgDriver.WaitUntilElementVisible(_hearingListPage.ParticipantsStatus(_context.Hearing.Cases.First().Number)).Text
                .Should().Be($"{count} Not Available");
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

        [Then(@"the VHO can see a list of hearings including the new hearing")]
        public void ThenTheVhoCanSeeAListOfHearingsIncludingTheNewHearing()
        {
            _browserContext.NgDriver.WaitUntilElementVisible(_hearingListPage._hearingWithCaseNumber(_context.Hearing.Cases.First().Number)).Displayed
                .Should().BeTrue();

            Debug.Assert(_context.Hearing.Scheduled_duration != null, "_context.Hearing.Scheduled_duration != null");
            var timespan = TimeSpan.FromMinutes(_context.Hearing.Scheduled_duration.Value);
            var listedFor = GetListedForTimeAsString(timespan);

            _browserContext.NgDriver.WaitUntilElementVisible(_hearingListPage.VideoHearingsOfficerTime(_context.Hearing.Cases.First().Number)).Text
                .Should().Be($"{_context.Hearing.Scheduled_date_time?.ToLocalTime():HH:mm}");

            _browserContext.NgDriver.WaitUntilElementVisible(_hearingListPage.VideoHearingsOfficerListedFor(_context.Hearing.Cases.First().Number)).Text
                .Should().Be($"{listedFor}");
        }

        [Then(@"the VHO can see the hearing view")]
        public void ThenTheVHOCanSeeTheHearingView()
        {
            _browserContext.NgDriver.WaitUntilElementVisible(_hearingListPage.WaitingRoomText).Displayed.Should().BeTrue();
        }

        [Then(@"the VHO should see the participant contact details")]
        public void ThenTheVhoShouldSeeTheParticipantContactDetails()
        {
            _browserContext.NgDriver.WrappedDriver.SwitchTo().ParentFrame();

            var hearingParticipants = _context.Hearing.Participants.FindAll(x =>
                x.User_role_name.Equals("Individual") || x.User_role_name.Equals("Representative"));

            var user = hearingParticipants.First().Last_name;

            var hearingParticipant = hearingParticipants.First();

            var firstParticipantLink = _browserContext.NgDriver.WaitUntilElementVisible(_hearingListPage.ParticipantName(hearingParticipant.Last_name));
            firstParticipantLink.Displayed.Should().BeTrue();

            var action = new Actions(_browserContext.NgDriver.WrappedDriver);
            action.MoveToElement(firstParticipantLink).Perform();

            var conferenceParticipant = _context.Conference.Participants.Find(x => x.Name.Contains(user));
            var participantEmailAndRole = $"{conferenceParticipant.Name} ({conferenceParticipant.Case_type_group})";

            _browserContext.NgDriver
                .WaitUntilElementVisible(_hearingListPage.ParticipantContactDetails(user, participantEmailAndRole)).Displayed
                .Should().BeTrue();

            _browserContext.NgDriver
                .WaitUntilElementVisible(_hearingListPage.ParticipantContactDetails(user, hearingParticipant.Contact_email)).Displayed
                .Should().BeTrue();

            _browserContext.NgDriver
                .WaitUntilElementVisible(_hearingListPage.ParticipantContactDetails(user, hearingParticipant.Telephone_number)).Displayed
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

            if (!timespan.Minutes.Equals(0) && timespan.Hours > 0)
            {
                if (timespan.Minutes.Equals(1))
                {
                    listedFor = listedFor + $" and 1 minute";
                }
                else
                {
                    listedFor = listedFor + $" and {timespan.Minutes} minutes";
                }
            }

            return listedFor;
        }
    }
}
