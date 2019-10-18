using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using FluentAssertions;
using OpenQA.Selenium.Support.Extensions;
using TechTalk.SpecFlow;
using Testing.Common.Helpers;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.AcceptanceTests.Pages;
using VideoWeb.AcceptanceTests.Users;
using ParticipantResponse = VideoWeb.Services.Bookings.ParticipantResponse;
using TestContext = VideoWeb.AcceptanceTests.Contexts.TestContext;
using UserRole = VideoWeb.Contract.Responses.UserRole;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public sealed class HearingsListSteps : ISteps
    {
        private readonly Dictionary<string, UserBrowser> _browsers;
        private readonly TestContext _tc;
        private readonly HearingListPage _page;
        private readonly ClerkHearingListPage _clerkPage;
        private const int ToleranceInMinutes = 3;
        private const int MinutesToWaitBeforeAllowedToJoinHearing = 30;

        public HearingsListSteps(Dictionary<string, UserBrowser> browsers, TestContext testContext, HearingListPage page, ClerkHearingListPage clerkPage)
        {
            _browsers = browsers;
            _tc = testContext;
            _page = page;
            _clerkPage = clerkPage;
        }

        [When(@"the user clicks on the Start Hearing button")]
        public void ProgressToNextPage()
        {
            if (_tc.Selftest)
            {
                WhenTheUserClicksTheCheckEquipmentButton();
            }
            else
            {
                var element = _tc.CurrentUser.Role.Equals("Clerk") ? _clerkPage.StartHearingButton(_tc.Hearing.Cases.First().Number) : _page.SignInButton(_tc.Hearing.Cases.First().Number);
                var tolerance = _tc.CurrentUser.Role.Equals("Clerk") ? 30 : ToleranceInMinutes * 60;
                _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_page.HearingListPageTitle).Displayed.Should().BeTrue();
                _browsers[_tc.CurrentUser.Key].Driver.ExecuteJavaScript("arguments[0].scrollIntoView(true);", _browsers[_tc.CurrentUser.Key].Driver.FindElement(element));
                _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(element, tolerance).Click();
            }           
        }

        [When(@"the user clicks on the Check Equipment button")]
        public void WhenTheUserClicksTheCheckEquipmentButton()
        {
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilElementClickable(_clerkPage.CheckEquipmentButton).Click();
        }

        [Then(@"a warning message appears indicating the user has no hearings scheduled")]
        public void ThenAWarningMessageAppearsIndicatingTheUserHasNoHearingsScheduled()
        {
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_page.NoHearingsWarningMessage).Displayed
                .Should().BeTrue();
        }

        [Then(@"the participant can see a list of hearings including the new hearing")]
        public void ThenTheParticipantCanSeeAListOfHearingsIncludingTheNewHearing()
        {
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_page.HearingWithCaseNumber(_tc.Hearing.Cases.First().Number)).Displayed
                .Should().BeTrue();

            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_page.ParticipantHearingDate(_tc.Hearing.Cases.First().Number)).Text
                .Should().Be(
                    $"{_tc.Hearing.Scheduled_date_time?.ToString(DateFormats.HearingListPageDate)}");

            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_page.ParticipantHearingTime(_tc.Hearing.Cases.First().Number)).Text
                .Should().Be(
                    $"{_tc.Hearing.Scheduled_date_time?.ToLocalTime():HH:mm}");
        }

        [Then(@"the user can see their details at the top of the hearing list")]
        public void ThenTheUserCanSeeTheirDetailsAtTheTopOfTheHearingList()
        {
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_clerkPage.ClerkHearingListTitle).Text
                .Should().Be($"Video hearings for {_tc.CurrentUser.Firstname}, {_tc.CurrentUser.Lastname}");
        }

        [Then(@"the Judge can see a list of hearings including the new hearing")]
        [Then(@"the Clerk can see a list of hearings including the new hearing")]
        public void ThenTheClerkCanSeeAListOfHearingsIncludingTheNewHearing()
        {
            if (_tc.Hearing.Scheduled_date_time == null || _tc.Hearing.Scheduled_duration == null)
            {
                throw new DataException("Required hearing values are null");
            }

            var scheduledDateTime = (DateTime)_tc.Hearing.Scheduled_date_time;
            scheduledDateTime = scheduledDateTime.ToLocalTime();
            var scheduledDuration = (int)_tc.Hearing.Scheduled_duration;

            var rowData = new GetHearingRow()
                .ForCaseNumber(_tc.CaseNumber())
                .ForJudge(_tc.CurrentUser.Displayname)
                .WithDriver(_browsers[_tc.CurrentUser.Key].Driver)
                .Fetch();

            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(
                    _clerkPage.ClerkHearingDate(scheduledDateTime.ToString(DateFormats.ClerkHearingListDate)))
                .Displayed.Should().BeTrue();

            rowData.StartTime.Should().Be(scheduledDateTime.ToString(DateFormats.ClerkHearingListTime));
            rowData.EndTime.Should().Be(scheduledDateTime.AddMinutes(scheduledDuration).ToString(DateFormats.ClerkHearingListTime));
            rowData.Judge.Should().Be(_tc.CurrentUser.Displayname);
            rowData.CaseName.Should().Be(_tc.CaseName());
            rowData.CaseType.Should().Be(_tc.Hearing.Case_type_name);
            rowData.CaseNumber.Should().Be(_tc.CaseNumber());

            ParticipantsDisplayed(_tc.Hearing.Participants, rowData);
        }

        [Then(@"contact us details for the clerk are available")]
        public void ThenContactUsDetailsForTheClerkAreAvailable()
        {
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_clerkPage.ClerkContactUs).Displayed.Should().BeTrue();

            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_clerkPage.ClerkPhoneNumber).Displayed.Should().BeTrue();
        }

        [Then(@"the new hearing isn't available to join yet")]
        public void ThenTheNewHearingIsnTAvailableToJoinYet()
        {
           var actualTime = _browsers[_tc.CurrentUser.Key].Driver
                .WaitUntilVisible(_page.WaitToSignInText(_tc.Hearing.Cases.First().Number))
                .Text;

            actualTime = actualTime.Substring(actualTime.Length - 5);

            var isWithinTimeframe = false;
            for (var i = -ToleranceInMinutes; i <= ToleranceInMinutes; i++)
            {
                if (!actualTime.Equals(DateTime.Now
                    .AddMinutes(_tc.DelayedStartTime - MinutesToWaitBeforeAllowedToJoinHearing + i)
                    .ToString("HH:mm"))) continue;
                isWithinTimeframe = true;
                break;
            }
            isWithinTimeframe.Should().BeTrue();
        }

        [Then(@"when the hearing is ready to start the hearing button appears")]
        public void ThenWhenTheHearingIsReadyToStartTheHearingButtonAppears()
        {
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_page.SignInButton(_tc.Hearing.Cases.First().Number), ToleranceInMinutes * 60).Displayed
                .Should().BeTrue();
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
