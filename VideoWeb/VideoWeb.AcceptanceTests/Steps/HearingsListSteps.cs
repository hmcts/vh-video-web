using System;
using System.Collections.Generic;
using System.Linq;
using AcceptanceTests.Common.Driver.Browser;
using AcceptanceTests.Common.Driver.Helpers;
using FluentAssertions;
using TechTalk.SpecFlow;
using VideoWeb.AcceptanceTests.Data;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.AcceptanceTests.Pages;
using ParticipantResponse = VideoWeb.Services.Bookings.ParticipantResponse;
using TestContext = VideoWeb.AcceptanceTests.Helpers.TestContext;

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
                var element = _c.CurrentUser.Role.Equals("Clerk") ? ClerkHearingListPage.StartHearingButton(_c.Test.Conference.Id) : ParticipantHearingListPage.SignInButton(_c.Test.Conference.Id);
                var tolerance = _c.CurrentUser.Role.Equals("Clerk") ? 30 : ToleranceInMinutes * 60;
                _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(ParticipantHearingListPage.HearingListPageTitle).Displayed.Should().BeTrue();
                _browsers[_c.CurrentUser.Key].ScrollTo(element);
                _browsers[_c.CurrentUser.Key].Click(element, tolerance);
            }           
        }

        [When(@"the user clicks on the Check Equipment button")]
        public void WhenTheUserClicksTheCheckEquipmentButton()
        {
            _browsers[_c.CurrentUser.Key].Click(ClerkHearingListPage.CheckEquipmentButton);
        }

        [Then(@"a warning message appears indicating the clerk has no hearings scheduled")]
        public void ThenAWarningMessageAppearsIndicatingTheClerkHasNoHearingsScheduled()
        {
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(ClerkHearingListPage.NoHearingsWarningMessage).Displayed.Should().BeTrue();
        }

        [Then(@"the hearing status should be displayed as Closed on the hearing list page")]
        public void ThenTheHearingStatusShouldBeDisplayedAsClosedOnTheHearingListPage()
        {
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(ClerkHearingListPage.Status(_c.Test.Conference.Id)).Text.Trim().Should().Be("Closed");
        }

        [Then(@"the Clerk is unable to access the Waiting Room")]
        public void ThenTheClerkIsUnableToAccessTheWaitingRoom()
        {
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilElementNotVisible(ClerkHearingListPage.StartHearingButton(_c.Test.Conference.Id)).Should().BeTrue();
        }

        [Then(@"the participant is able to access the hearing")]
        public void ThenTheParticipantIsAbleToAccessTheWaitingRoom()
        {
            _browsers[_c.CurrentUser.Key].Click(ParticipantHearingListPage.SignInButton(_c.Test.Conference.Id));
            _browsers[_c.CurrentUser.Key].Retry(() => _browsers[_c.CurrentUser.Key].Driver.Url.Trim().Should().Contain(Page.Introduction.Url),2);
        }

        [Then(@"the participant is unable to access the hearing")]
        public void ThenTheParticipantIsUnableToAccessTheWaitingRoom()
        {
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilElementNotVisible(ParticipantHearingListPage.SignInButton(_c.Test.Conference.Id)).Should().BeTrue();
        }

        [Then(@"a warning message appears indicating the participant has no hearings scheduled")]
        public void ThenAWarningMessageAppearsIndicatingTheParticipantHasNoHearingsScheduled()
        {
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(ParticipantHearingListPage.NoHearingsWarningMessage).Displayed.Should().BeTrue();
        }

        [Then(@"the participant can see a list of hearings including the new hearing")]
        public void ThenTheParticipantCanSeeAListOfHearingsIncludingTheNewHearing()
        {
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(ParticipantHearingListPage.CaseNumber(_c.Test.Conference.Id)).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(ParticipantHearingListPage.HearingDate(_c.Test.Conference.Id)).Text.Should().Be($"{_c.TimeZone.Adjust(_c.Test.Hearing.Scheduled_date_time).ToString(DateFormats.HearingListPageDate)}");
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(ParticipantHearingListPage.HearingTime(_c.Test.Conference.Id)).Text.Should().Be($"{_c.TimeZone.Adjust(_c.Test.Hearing.Scheduled_date_time):HH:mm}");
        }

        [Then(@"the user can see their details at the top of the hearing list")]
        public void ThenTheUserCanSeeTheirDetailsAtTheTopOfTheHearingList()
        {
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(ClerkHearingListPage.HearingListTitle).Text
                .Should().Be($"Video hearings for {_c.CurrentUser.Firstname}, {_c.CurrentUser.Lastname}");
        }

        [Then(@"the Judge can see a list of hearings including the new hearing")]
        [Then(@"the Clerk can see a list of hearings including the new hearing")]
        public void ThenTheClerkCanSeeAListOfHearingsIncludingTheNewHearing()
        {
            var scheduledDateTime = _c.TimeZone.Adjust(_c.Test.Hearing.Scheduled_date_time);
            var scheduledDuration = _c.Test.Hearing.Scheduled_duration;

            var rowData = new GetHearingRow()
                .WithConferenceId(_c.Test.Conference.Id)
                .WithDriver(_browsers[_c.CurrentUser.Key])
                .ApplicantsCount(_c.Test.Conference.Participants.Count(x => x.Case_type_group.Equals("Claimant")))
                .RespondantsCount(_c.Test.Conference.Participants.Count(x => x.Case_type_group.Equals("Defendant")))
                .Fetch();

            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(ClerkHearingListPage.Date(scheduledDateTime.ToString(DateFormats.ClerkHearingListDate))).Displayed.Should().BeTrue();
            rowData.StartTime.Should().Be(scheduledDateTime.ToString(DateFormats.ClerkHearingListTime));
            rowData.EndTime.Should().Be(scheduledDateTime.AddMinutes(scheduledDuration).ToString(DateFormats.ClerkHearingListTime));
            rowData.Judge.Should().Be(_c.CurrentUser.DisplayName);
            rowData.CaseName.Trim().Should().Be(_c.Test.Case.Name);
            rowData.CaseType.Trim().Should().Be(_c.Test.Hearing.Case_type_name);
            rowData.CaseNumber.Trim().Should().Be(_c.Test.Case.Number);
            ParticipantsDisplayed(_c.Test.HearingParticipants, rowData);
        }

        [Then(@"contact us details for the clerk are available")]
        public void ThenContactUsDetailsForTheClerkAreAvailable()
        {
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(ClerkHearingListPage.ContactUs).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(ClerkHearingListPage.PhoneNumber(_c.Test.CommonData.CommonOnScreenData.VhoPhone)).Displayed.Should().BeTrue();
        }

        [Then(@"the new hearing isn't available to join yet")]
        public void ThenTheNewHearingIsnTAvailableToJoinYet()
        {
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(ParticipantHearingListPage.SignInDate(_c.Test.Conference.Id)).Text.Trim().Should().Contain("Today");
            var signInTime = _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(ParticipantHearingListPage.SignInTime(_c.Test.Conference.Id)).Text.Trim();
            signInTime = signInTime.Replace("from ", "");
            CheckIfHearingTimeIsWithinTolerance(signInTime);
        }

        private void CheckIfHearingTimeIsWithinTolerance(string signInTime)
        {
            var isWithinTimeFrame = false;
            for (var i = -ToleranceInMinutes; i <= ToleranceInMinutes; i++)
            {
                if (!signInTime.Equals(_c.TimeZone.Adjust(DateTime.Now
                        .AddMinutes(_c.Test.DelayedStartTime - MinutesToWaitBeforeAllowedToJoinHearing + i))
                    .ToString("HH:mm"))) continue;
                isWithinTimeFrame = true;
                break;
            }

            isWithinTimeFrame.Should().BeTrue();
        }

        [Then(@"when the hearing is ready to start the hearing button appears")]
        public void ThenWhenTheHearingIsReadyToStartTheHearingButtonAppears()
        {
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(ParticipantHearingListPage.SignInButton(_c.Test.Conference.Id), ToleranceInMinutes * 60).Displayed.Should().BeTrue();
        }

        [Then(@"the Video Hearings Officer should only see hearings for today")]
        public void ThenTheVideoHearingsOfficerShouldOnlySeeHearingsForToday()
        {
            foreach (var conference in _c.Test.Conferences)
            {
                if (_c.TimeZone.Adjust(conference.Scheduled_date_time).Day.Equals(_c.TimeZone.Adjust(DateTime.Now).Day))
                {
                    _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(VhoHearingListPage.CaseName(conference.Id)).Displayed.Should().BeTrue();
                }
                else
                {
                    _browsers[_c.CurrentUser.Key].Driver.WaitUntilElementNotVisible(VhoHearingListPage.CaseName(conference.Id)).Should().BeTrue();
                }
            }
        }

        private static void ParticipantsDisplayed(IEnumerable<ParticipantResponse> participants, HearingRow rowData)
        {
            var participantResponses = participants.ToList();
            if (participantResponses.Any(x => x.Hearing_role_name.Equals("Representative")))
            {
                AssertHearingWithRepresentatives(participantResponses, rowData);
            }
            else
            {
                AssertHearingWithIndividualsOnly(participantResponses, rowData);
            }
        }

        private static void AssertHearingWithRepresentatives(IReadOnlyCollection<ParticipantResponse> participantResponses, HearingRow rowData)
        {
            var applicantRep = participantResponses.First(x => x.Case_role_name.Equals("Claimant") && x.Hearing_role_name.Equals("Representative"));
            var respondentRep = participantResponses.First(x => x.Case_role_name.Equals("Defendant") && x.Hearing_role_name.Equals("Representative"));
            rowData.ApplicantRep.Trim().Should().Be(applicantRep.Display_name);
            rowData.ApplicantRepresentee.Trim().Should().Be(applicantRep.Representee);
            rowData.RespondentRep.Trim().Should().Be(respondentRep.Display_name);
            rowData.RespondentRepresentee.Trim().Should().Be(respondentRep.Representee);
        }

        private static void AssertHearingWithIndividualsOnly(IReadOnlyCollection<ParticipantResponse> participantResponses, HearingRow rowData)
        {
            var applicantIndividual = participantResponses.First(x => x.Case_role_name.Equals("Claimant"));
            var respondentIndividual = participantResponses.First(x => x.Case_role_name.Equals("Defendant"));
            rowData.ApplicantIndividual.Trim().Should().Be(applicantIndividual.Display_name);
            rowData.RespondentIndividual.Trim().Should().Be(respondentIndividual.Display_name);
        }
    }
}
