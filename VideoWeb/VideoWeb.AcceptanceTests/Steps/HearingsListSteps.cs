using System;
using System.Collections.Generic;
using AcceptanceTests.Common.Driver.Browser;
using AcceptanceTests.Common.Driver.Helpers;
using FluentAssertions;
using OpenQA.Selenium.Support.Extensions;
using TechTalk.SpecFlow;
using Testing.Common.Helpers;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.AcceptanceTests.Pages;
using ParticipantResponse = VideoWeb.Services.Bookings.ParticipantResponse;
using TestContext = VideoWeb.AcceptanceTests.Helpers.TestContext;
using UserRole = VideoWeb.Contract.Responses.UserRole;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public sealed class HearingsListSteps : ISteps
    {
        private const int ToleranceInMinutes = 3;
        private const int MinutesToWaitBeforeAllowedToJoinHearing = 30;
        private readonly Dictionary<string, UserBrowser> _browsers;
        private readonly TestContext _c;

        public HearingsListSteps(Dictionary<string, UserBrowser> browsers, TestContext testContext)
        {
            _browsers = browsers;
            _c = testContext;
        }

        [When(@"the user clicks on the Start Hearing button")]
        public void ProgressToNextPage()
        {
            if (_c.Test.SelfTestJourney)
            {
                WhenTheUserClicksTheCheckEquipmentButton();
            }
            else
            {
                var element = _c.CurrentUser.Role.Equals("Clerk") ? ClerkHearingListPage.StartHearingButton(_c.Test.Case.Number) : HearingListPage.SignInButton(_c.Test.Case.Number);
                var tolerance = _c.CurrentUser.Role.Equals("Clerk") ? 30 : ToleranceInMinutes * 60;
                _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(HearingListPage.HearingListPageTitle).Displayed.Should().BeTrue();
                _browsers[_c.CurrentUser.Key].Driver.ExecuteJavaScript("arguments[0].scrollIntoView(true);", _browsers[_c.CurrentUser.Key].Driver.FindElement(element));
                _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(element, tolerance).Click();
            }           
        }

        [When(@"the user clicks on the Check Equipment button")]
        public void WhenTheUserClicksTheCheckEquipmentButton()
        {
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilElementClickable(ClerkHearingListPage.CheckEquipmentButton).Click();
        }

        [Then(@"a warning message appears indicating the clerk has no hearings scheduled")]
        public void ThenAWarningMessageAppearsIndicatingTheClerkHasNoHearingsScheduled()
        {
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(HearingListPage.ClerkNoHearingsWarningMessage).Displayed.Should().BeTrue();
        }

        [Then(@"a warning message appears indicating the participant has no hearings scheduled")]
        public void ThenAWarningMessageAppearsIndicatingTheParticipantHasNoHearingsScheduled()
        {
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(HearingListPage.ParticipantNoHearingsWarningMessage).Displayed.Should().BeTrue();
        }

        [Then(@"the participant can see a list of hearings including the new hearing")]
        public void ThenTheParticipantCanSeeAListOfHearingsIncludingTheNewHearing()
        {
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(HearingListPage.HearingWithCaseNumber(_c.Test.Case.Number)).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(HearingListPage.ParticipantHearingDate(_c.Test.Case.Number)).Text.Should().Be($"{_c.Test.Hearing.Scheduled_date_time.ToString(DateFormats.HearingListPageDate)}");
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(HearingListPage.ParticipantHearingTime(_c.Test.Case.Number)).Text.Should().Be($"{_c.Test.Hearing.Scheduled_date_time.ToLocalTime():HH:mm}");
        }

        [Then(@"the user can see their details at the top of the hearing list")]
        public void ThenTheUserCanSeeTheirDetailsAtTheTopOfTheHearingList()
        {
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(ClerkHearingListPage.ClerkHearingListTitle).Text
                .Should().Be($"Video hearings for {_c.CurrentUser.Firstname}, {_c.CurrentUser.Lastname}");
        }

        [Then(@"the Judge can see a list of hearings including the new hearing")]
        [Then(@"the Clerk can see a list of hearings including the new hearing")]
        public void ThenTheClerkCanSeeAListOfHearingsIncludingTheNewHearing()
        {
            var scheduledDateTime = _c.Test.Hearing.Scheduled_date_time;
            scheduledDateTime = scheduledDateTime.ToLocalTime();
            var scheduledDuration = _c.Test.Hearing.Scheduled_duration;

            var rowData = new GetHearingRow()
                .ForCaseNumber(_c.Test.Case.Number)
                .ForJudge(_c.CurrentUser.DisplayName)
                .WithDriver(_browsers[_c.CurrentUser.Key])
                .Fetch();

            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(ClerkHearingListPage.ClerkHearingDate(scheduledDateTime.ToString(DateFormats.ClerkHearingListDate))).Displayed.Should().BeTrue();
            rowData.StartTime.Should().Be(scheduledDateTime.ToString(DateFormats.ClerkHearingListTime));
            rowData.EndTime.Should().Be(scheduledDateTime.AddMinutes(scheduledDuration).ToString(DateFormats.ClerkHearingListTime));
            rowData.Judge.Should().Be(_c.CurrentUser.DisplayName);
            rowData.CaseName.Should().Be(_c.Test.Case.Name);
            rowData.CaseType.Should().Be(_c.Test.Hearing.Case_type_name);
            rowData.CaseNumber.Should().Be(_c.Test.Case.Number);
            ParticipantsDisplayed(_c.Test.Hearing.Participants, rowData);
        }

        [Then(@"contact us details for the clerk are available")]
        public void ThenContactUsDetailsForTheClerkAreAvailable()
        {
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(ClerkHearingListPage.ClerkContactUs).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(ClerkHearingListPage.ClerkPhoneNumber).Displayed.Should().BeTrue();
        }

        [Then(@"the new hearing isn't available to join yet")]
        public void ThenTheNewHearingIsnTAvailableToJoinYet()
        {
           var actualTime = _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(HearingListPage.WaitToSignInText(_c.Test.Case.Number)).Text;
           actualTime = actualTime.Substring(actualTime.Length - 5);

            var isWithinTimeFrame = false;
            for (var i = -ToleranceInMinutes; i <= ToleranceInMinutes; i++)
            {
                if (!actualTime.Equals(DateTime.Now
                    .AddMinutes(_c.Test.DelayedStartTime - MinutesToWaitBeforeAllowedToJoinHearing + i)
                    .ToString("HH:mm"))) continue;
                isWithinTimeFrame = true;
                break;
            }
            isWithinTimeFrame.Should().BeTrue();
        }

        [Then(@"when the hearing is ready to start the hearing button appears")]
        public void ThenWhenTheHearingIsReadyToStartTheHearingButtonAppears()
        {
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(HearingListPage.SignInButton(_c.Test.Case.Number), ToleranceInMinutes * 60).Displayed.Should().BeTrue();
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
