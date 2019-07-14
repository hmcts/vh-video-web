using System;
using System.Collections.Generic;
using System.Data;
using System.Diagnostics;
using System.Linq;
using FluentAssertions;
using OpenQA.Selenium.Support.Extensions;
using Protractor;
using TechTalk.SpecFlow;
using Testing.Common.Helpers;
using VideoWeb.AcceptanceTests.Contexts;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.AcceptanceTests.Pages;
using VideoWeb.Contract.Responses;
using ParticipantResponse = VideoWeb.Services.Bookings.ParticipantResponse;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public sealed class HearingsListSteps
    {
        private readonly NgWebDriver _driver;
        private readonly TestContext _context;
        private readonly HearingListPage _page;
        private readonly ClerkHearingListPage _clerkPage;
        private readonly VhoHearingListPage _vhoPage;
        private const int TollerenceInMinutes = 3;
        private const int MinutesToWaitBeforeAllowedToJoinHearing = 30;

        public HearingsListSteps(BrowserContext browser, TestContext context, HearingListPage page,
            ClerkHearingListPage clerkPage, VhoHearingListPage vhoPage)
        {
            _driver = browser.NgDriver;
            _context = context;
            _page = page;
            _clerkPage = clerkPage;
            _vhoPage = vhoPage;
        }

        [When(@"the user clicks on the Start Hearing button")]
        public void WhenTheUserClicksTheStartButton()
        {
            var element = _context.CurrentUser.Role.Equals("Clerk") ? _clerkPage.StartHearingButton(_context.Hearing.Cases.First().Number) : _page.SignInButton(_context.Hearing.Cases.First().Number);
            var tollerence = _context.CurrentUser.Role.Equals("Clerk") ? 30 : TollerenceInMinutes * 60;
            _driver.ExecuteJavaScript("arguments[0].scrollIntoView(true);", _driver.FindElement(element));
            _driver.WaitUntilElementClickable(element, tollerence).Click();
        }

        [When(@"the user clicks on the Check Equipment button")]
        public void WhenTheUserClicksTheCheckEquipmentButton()
        {
            _driver.WaitUntilElementClickable(_clerkPage.CheckEquipmentButton).Click();
        }

        [When(@"the VHO selects the hearing")]
        public void WhenTheVhoSelectsTheHearing()
        {
            _driver
                .WaitUntilElementVisible(
                    _vhoPage.VideoHearingsOfficerSelectHearingButton(_context.Hearing.Cases.First().Number))
                .Click();

            _driver.WaitUntilElementVisible(_vhoPage.AdminIframe).Displayed.Should().BeTrue();
            _driver.SwitchTo().Frame(VhoHearingListPage.AdminIframeId);
            _driver.WaitUntilElementVisible(_vhoPage.WaitingRoomText).Displayed.Should().BeTrue();
        }

        [Then(@"a warning message appears indicating the user has no hearings scheduled")]
        public void ThenAWarningMessageAppearsIndicatingTheUserHasNoHearingsScheduled()
        {
            _driver.WaitUntilElementVisible(_page.NoHearingsWarningMessage).Displayed
                .Should().BeTrue();
        }

        [Then(@"the participant can see a list of hearings including the new hearing")]
        public void ThenTheParticipantCanSeeAListOfHearingsIncludingTheNewHearing()
        {
            _driver.WaitUntilElementVisible(_page.HearingWithCaseNumber(_context.Hearing.Cases.First().Number)).Displayed
                .Should().BeTrue();

            _driver.WaitUntilElementVisible(_page.ParticipantHearingDate(_context.Hearing.Cases.First().Number)).Text
                .Should().Be(
                    $"{_context.Hearing.Scheduled_date_time?.ToString(DateFormats.HearingListPageDate)}");

            _driver.WaitUntilElementVisible(_page.ParticipantHearingTime(_context.Hearing.Cases.First().Number)).Text
                .Should().Be(
                    $"{_context.Hearing.Scheduled_date_time?.ToLocalTime():HH:mm}");
        }

        [Then(@"the user can see their details at the top of the hearing list")]
        public void ThenTheUserCanSeeTheirDetailsAtTheTopOfTheHearingList()
        {
            _driver.WaitUntilElementVisible(_clerkPage.ClerkHearingListTitle).Text
                .Should().Be($"Video hearings for {_context.CurrentUser.Firstname}, {_context.CurrentUser.Lastname}");
        }

        [Then(@"the Judge can see a list of hearings including the new hearing")]
        [Then(@"the Clerk can see a list of hearings including the new hearing")]
        public void ThenTheClerkCanSeeAListOfHearingsIncludingTheNewHearing()
        {
            if (_context.Hearing.Scheduled_date_time == null || _context.Hearing.Scheduled_duration == null)
            {
                throw new DataException("Required hearing values are null");
            }

            var scheduledDateTime = (DateTime)_context.Hearing.Scheduled_date_time;
            scheduledDateTime = scheduledDateTime.ToLocalTime();
            var scheduledDuration = (int)_context.Hearing.Scheduled_duration;

            var rowData = new GetHearingRow()
                .ForCaseNumber(_context.CaseNumber())
                .ForJudge(_context.CurrentUser.Displayname)
                .WithDriver(_driver)
                .Fetch();

            _driver.WaitUntilElementVisible(
                    _clerkPage.ClerkHearingDate(scheduledDateTime.ToString(DateFormats.ClerkHearingListDate)))
                .Displayed.Should().BeTrue();

            rowData.StartTime.Should().Be(scheduledDateTime.ToString(DateFormats.ClerkHearingListTime));
            rowData.EndTime.Should().Be(scheduledDateTime.AddMinutes(scheduledDuration).ToString(DateFormats.ClerkHearingListTime));
            rowData.Judge.Should().Be(_context.CurrentUser.Displayname);
            rowData.CaseName.Should().Be(_context.CaseName());
            rowData.CaseType.Should().Be(_context.Hearing.Case_type_name);
            rowData.CaseNumber.Should().Be(_context.CaseNumber());

            ParticipantsDisplayed(_context.Hearing.Participants, rowData);
        }

        [Then(@"contact us details for the clerk are available")]
        public void ThenContactUsDetailsForTheClerkAreAvailable()
        {
            _driver.WaitUntilElementVisible(_clerkPage.ClerkContactUs).Displayed.Should().BeTrue();

            _driver.WaitUntilElementVisible(_clerkPage.ClerkPhoneNumber).Displayed.Should().BeTrue();
        }

        [Then(@"the new hearing isn't available to join yet")]
        public void ThenTheNewHearingIsnTAvailableToJoinYet()
        {
           var actualTime = _driver
                .WaitUntilElementVisible(_page.WaitToSignInText(_context.Hearing.Cases.First().Number))
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
            _driver.WaitUntilElementVisible(_page.SignInButton(_context.Hearing.Cases.First().Number), TollerenceInMinutes * 60).Displayed
                .Should().BeTrue();
        }        

        [Then(@"the VHO can see a list of hearings including the new hearing")]
        public void ThenTheVhoCanSeeAListOfHearingsIncludingTheNewHearing()
        {
            _driver.WaitUntilElementVisible(_vhoPage.HearingWithCaseNumber(_context.Hearing.Cases.First().Number)).Displayed
                .Should().BeTrue();

            Debug.Assert(_context.Hearing.Scheduled_duration != null, "_context.Hearing.Scheduled_duration != null");
            var timespan = TimeSpan.FromMinutes(_context.Hearing.Scheduled_duration.Value);
            var listedFor = GetListedForTimeAsString(timespan);

            _driver.WaitUntilElementVisible(_vhoPage.VideoHearingsOfficerTime(_context.Hearing.Cases.First().Number)).Text
                .Should().Be($"{_context.Hearing.Scheduled_date_time?.ToLocalTime():HH:mm}");

            _driver.WaitUntilElementVisible(_vhoPage.VideoHearingsOfficerListedFor(_context.Hearing.Cases.First().Number)).Text
                .Should().Be($"{listedFor}");
        }

        [Then(@"the VHO can see the hearing view")]
        public void ThenTheVhoCanSeeTheHearingView()
        {
            _driver.WaitUntilElementVisible(_vhoPage.WaitingRoomText).Displayed.Should().BeTrue();
        }

        [Then(@"the VHO should see the participant contact details")]
        public void ThenTheVhoShouldSeeTheParticipantContactDetails()
        {
            _driver.WrappedDriver.SwitchTo().ParentFrame();

            var hearingParticipants = _context.Hearing.Participants.FindAll(x =>
                x.User_role_name.Equals("Individual") || x.User_role_name.Equals("Representative"));

            var user = hearingParticipants.First().Last_name;

            var hearingParticipant = hearingParticipants.First();

            var firstParticipantLink = _driver.WaitUntilElementVisible(_vhoPage.ParticipantName(hearingParticipant.Last_name));
            firstParticipantLink.Displayed.Should().BeTrue();

            var action = new OpenQA.Selenium.Interactions.Actions(_driver.WrappedDriver);
            action.MoveToElement(firstParticipantLink).Perform();

            var conferenceParticipant = _context.Conference.Participants.Find(x => x.Name.Contains(user));
            var participantEmailAndRole = $"{conferenceParticipant.Name} ({conferenceParticipant.Case_type_group})";

            _driver
                .WaitUntilElementVisible(_vhoPage.ParticipantContactDetails(user, participantEmailAndRole)).Displayed
                .Should().BeTrue();

            _driver
                .WaitUntilElementVisible(_vhoPage.ParticipantContactDetails(user, hearingParticipant.Contact_email)).Displayed
                .Should().BeTrue();

            _driver
                .WaitUntilElementVisible(_vhoPage.ParticipantContactDetails(user, hearingParticipant.Telephone_number)).Displayed
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

        private static void ParticipantsDisplayed(IEnumerable<ParticipantResponse> participants, HearingRow rowData)
        {
           foreach (var participant in participants)
            {
                if (!participant.User_role_name.Equals(UserRole.Individual.ToString()) &&
                    !participant.User_role_name.Equals(UserRole.Representative.ToString())) continue;

                var individualIsDisplayed = false;
                var representativeIsDisplayed = false;

                foreach (var party in rowData.Parties)
                {                   
                    if (participant.User_role_name.Equals(UserRole.Individual.ToString()) &&
                        party.IndividualName.Equals(participant.Display_name))
                    {
                        individualIsDisplayed = true;
                        break;
                    }

                    if (!participant.User_role_name.Equals(UserRole.Representative.ToString()) ||
                        !party.RepresentativeName.Equals(participant.Display_name)) continue;
                    representativeIsDisplayed = true;
                    break;
                }

                var participantIsDisplayed = individualIsDisplayed || representativeIsDisplayed;
                participantIsDisplayed.Should().BeTrue();
            }           
        }
    }
}
