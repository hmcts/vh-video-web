using System;
using System.Collections.Generic;
using System.Linq;
using AcceptanceTests.Common.Driver.Drivers;
using AcceptanceTests.Common.Driver.Helpers;
using FluentAssertions;
using TechTalk.SpecFlow;
using VideoWeb.AcceptanceTests.Data;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.AcceptanceTests.Pages;
using TestApi.Contract.Dtos;
using TestApi.Contract.Enums;
using TestContext = VideoWeb.AcceptanceTests.Helpers.TestContext;
using BookingsApi.Contract.Responses;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public sealed class HearingsListSteps : ISteps
    {
        private const int ToleranceInMinutes = 3;
        private const int MinutesToWaitBeforeAllowedToJoinHearing = 30;
        private readonly Dictionary<UserDto, UserBrowser> _browsers;
        private readonly TestContext _c;

        public HearingsListSteps(Dictionary<UserDto, UserBrowser> browsers, TestContext testContext)
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
                var element = (_c.CurrentUser.UserType == UserType.Judge ||
                               _c.CurrentUser.UserType == UserType.Winger ||
                               _c.CurrentUser.UserType == UserType.PanelMember) ? JudgeHearingListPage.StartHearingButton(_c.Test.Conference.Id) : ParticipantHearingListPage.SignInButton(_c.Test.Conference.Id);
                var tolerance = _c.CurrentUser.UserType == UserType.Judge ? 30 : ToleranceInMinutes * 60;
                _browsers[_c.CurrentUser].Driver.WaitUntilVisible(ParticipantHearingListPage.HearingListPageTitle).Displayed.Should().BeTrue();
                _browsers[_c.CurrentUser].ScrollTo(element);
                _browsers[_c.CurrentUser].Click(element, tolerance);
            }           
        }

        [When(@"the user clicks on the Check Equipment button")]
        public void WhenTheUserClicksTheCheckEquipmentButton()
        {
            _browsers[_c.CurrentUser].Click(JudgeHearingListPage.CheckEquipmentButton);
        }

        [When(@"the user clicks on Consultation Room link")]
        public void WhenTheUserClicksOnConsultationRoomLink()
        {
            var closeTime = _c.TimeZone.Adjust(_c.Test.HearingClosedTime.AddMinutes(_c.VideoWebConfig.consultationRoomTimeout)).ToString(DateFormats.WaitingRoomPageTime);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(VhoHearingListPage.ConsultationRoomLink(closeTime)).Click();
        }

        [Then(@"a warning message appears indicating the Judge has no hearings scheduled")]
        public void ThenAWarningMessageAppearsIndicatingTheJudgeHasNoHearingsScheduled()
        {
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(JudgeHearingListPage.NoHearingsWarningMessage).Displayed.Should().BeTrue();
        }

        [Then(@"the hearing status should be displayed as Closed on the hearing list page")]
        public void ThenTheHearingStatusShouldBeDisplayedAsClosedOnTheHearingListPage()
        {
            _browsers[_c.CurrentUser].TextOf(JudgeHearingListPage.Status(_c.Test.Conference.Id)).Should().Be("Closed");
        }

        [Then(@"the Judge is unable to access the Waiting Room")]
        public void ThenTheJudgeIsUnableToAccessTheWaitingRoom()
        {
            _browsers[_c.CurrentUser].Driver.WaitUntilElementNotVisible(JudgeHearingListPage.StartHearingButton(_c.Test.Conference.Id)).Should().BeTrue();
        }

        [Then(@"the participant is able to access the hearing")]
        public void ThenTheParticipantIsAbleToAccessTheWaitingRoom()
        {
            _browsers[_c.CurrentUser].Click(ParticipantHearingListPage.SignInButton(_c.Test.Conference.Id));
            _browsers[_c.CurrentUser].Retry(() => _browsers[_c.CurrentUser].Driver.Url.Trim().Should().Contain(Page.Introduction.Url),2);
        }

        [Then(@"the participant is unable to access the hearing")]
        public void ThenTheParticipantIsUnableToAccessTheWaitingRoom()
        {
            _browsers[_c.CurrentUser].Driver.WaitUntilElementNotVisible(ParticipantHearingListPage.SignInButton(_c.Test.Conference.Id)).Should().BeTrue();
        }

        [Then(@"a warning message appears indicating the participant has no hearings scheduled")]
        public void ThenAWarningMessageAppearsIndicatingTheParticipantHasNoHearingsScheduled()
        {
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(ParticipantHearingListPage.NoHearingsWarningMessage).Displayed.Should().BeTrue();
        }

        [Then(@"the participant can see a list of hearings including the new hearing")]
        public void ThenTheParticipantCanSeeAListOfHearingsIncludingTheNewHearing()
        {
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(ParticipantHearingListPage.CaseNumber(_c.Test.Conference.Id)).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser].TextOf(ParticipantHearingListPage.HearingDate(_c.Test.Conference.Id)).Should().Be($"{_c.TimeZone.Adjust(_c.Test.Hearing.ScheduledDateTime).ToString(DateFormats.HearingListPageDate)}");
            _browsers[_c.CurrentUser].TextOf(ParticipantHearingListPage.HearingTime(_c.Test.Conference.Id)).Should().Be($"{_c.TimeZone.Adjust(_c.Test.Hearing.ScheduledDateTime):HH:mm}");
        }

        [Then(@"the Panel Member can see a list of hearings including the new hearing")]
        public void ThenThePanelMemberCanSeeAListOfHearingsIncludingTheNewHearing()
        {
            var scheduledDateTime = _c.TimeZone.Adjust(_c.Test.Hearing.ScheduledDateTime);
            var scheduledDuration = _c.Test.Hearing.ScheduledDuration;

            var rowData = new GetHearingRow()
                .WithConferenceId(_c.Test.Conference.Id)
                .WithDriver(_browsers[_c.CurrentUser])
                .Fetch();

            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(PanelMemberHearingListPage.Date(scheduledDateTime.ToString(DateFormats.JudgeHearingListDate))).Displayed.Should().BeTrue();
            rowData.StartTime.Should().Be(scheduledDateTime.ToString(DateFormats.JudgeHearingListTime));
            rowData.EndTime.Should().Be(scheduledDateTime.AddMinutes(scheduledDuration).ToString(DateFormats.JudgeHearingListTime));
            rowData.CaseNumber.Trim().Should().Be(_c.Test.Case.Number);
        }

        [Then(@"the user can see their details at the top of the hearing list")]
        public void ThenTheUserCanSeeTheirDetailsAtTheTopOfTheHearingList()
        {
            _browsers[_c.CurrentUser].TextOf(JudgeHearingListPage.HearingListTitle).Should().Be($"Video hearings for {_c.CurrentUser.FirstName}, {_c.CurrentUser.LastName}");
        }

        [Then(@"the Judge can see a list of hearings including the new hearing")]
        public void ThenTheJudgeCanSeeAListOfHearingsIncludingTheNewHearing()
        {
            var scheduledDateTime = _c.TimeZone.Adjust(_c.Test.Hearing.ScheduledDateTime);
            var scheduledDuration = _c.Test.Hearing.ScheduledDuration;

            var rowData = new GetHearingRow()
                .WithConferenceId(_c.Test.Conference.Id)
                .WithDriver(_browsers[_c.CurrentUser])
                .Fetch();

            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(JudgeHearingListPage.Date(scheduledDateTime.ToString(DateFormats.JudgeHearingListDate))).Displayed.Should().BeTrue();
            rowData.StartTime.Should().Be(scheduledDateTime.ToString(DateFormats.JudgeHearingListTime));
            rowData.EndTime.Should().Be(scheduledDateTime.AddMinutes(scheduledDuration).ToString(DateFormats.JudgeHearingListTime));
            rowData.Judge.Should().Be(_c.CurrentUser.DisplayName);
            rowData.CaseName.Trim().Should().Be(_c.Test.Case.Name);
            rowData.CaseType.Trim().Should().Be(_c.Test.Hearing.CaseTypeName);
            rowData.CaseNumber.Trim().Should().Be(_c.Test.Case.Number);
            ParticipantsDisplayed(_c.Test.HearingParticipants, rowData);
        }

        [Then(@"contact us details for the Judge are available")]
        public void ThenContactUsDetailsForTheJudgeAreAvailable()
        {
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(JudgeHearingListPage.ContactUs).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(JudgeHearingListPage.PhoneNumber(_c.Test.CommonData.CommonOnScreenData.VhoPhone)).Displayed.Should().BeTrue();
        }

        [Then(@"contact us details for the Panel Member are available")]
        public void ThenContactUsDetailsForThePanelMemberAreAvailable()
        {
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(JudgeHearingListPage.ContactUs).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(JudgeHearingListPage.PhoneNumber(_c.Test.CommonData.CommonOnScreenData.VhoPhone)).Displayed.Should().BeTrue();
        }

        [Then(@"the new hearing isn't available to join yet")]
        public void ThenTheNewHearingIsnTAvailableToJoinYet()
        {
            _browsers[_c.CurrentUser].TextOf(ParticipantHearingListPage.SignInDate(_c.Test.Conference.Id)).Should().Contain("Today");
            var signInTime = _browsers[_c.CurrentUser].TextOf(ParticipantHearingListPage.SignInTime(_c.Test.Conference.Id));
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
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(ParticipantHearingListPage.SignInButton(_c.Test.Conference.Id), ToleranceInMinutes * 60).Displayed.Should().BeTrue();
        }

        [Then(@"the Video Hearings Officer should only see hearings for today")]
        public void ThenTheVideoHearingsOfficerShouldOnlySeeHearingsForToday()
        {
            foreach (var conference in _c.Test.Conferences)
            {
                if (_c.TimeZone.Adjust(conference.ScheduledDateTime).Day.Equals(_c.TimeZone.Adjust(DateTime.Now).Day))
                {
                    _browsers[_c.CurrentUser].Driver.WaitUntilVisible(VhoHearingListPage.CaseName(conference.Id)).Displayed.Should().BeTrue();
                }
                else
                {
                    _browsers[_c.CurrentUser].Driver.WaitUntilElementNotVisible(VhoHearingListPage.CaseName(conference.Id)).Should().BeTrue();
                }
            }
        }

        private static void ParticipantsDisplayed(IEnumerable<ParticipantResponse> participants, HearingRow rowData)
        {
            var participantResponses = participants.ToList();
            AssertParticipantsCount(participantResponses, rowData);
        }

        private static void AssertParticipantsCount(IList<ParticipantResponse> participantResponses, HearingRow rowData)
        {
            var participantsCount = participantResponses.Count(x => x.HearingRoleName == "Individual" || x.HearingRoleName == "Representative" || x.HearingRoleName == "Litigant in person");
            if (participantsCount > 0)
            {
                var participantEnding = participantsCount > 1 ? "s" : "";
                var participantsCountText = $"{participantsCount} Participant{participantEnding}";
                rowData.ParticipantCount.Should().Be(participantsCountText);
            }

            var panelMembersCount = participantResponses.Count(x => x.HearingRoleName == "Panel Member");
            if (panelMembersCount > 0)
            {
                var panelMembersEnding = panelMembersCount > 1 ? "s" : "";
                var panelMembersCountText = $"{panelMembersCount} Panel Member{panelMembersEnding}";
                rowData.PanelMembersCount.Should().Be(panelMembersCountText);
            }

            var observersCount = participantResponses.Count(x => x.HearingRoleName == "Observer");
            if (observersCount > 0)
            {
                var observersEnding = observersCount > 1 ? "s" : "";
                var observersCountText = $"{observersCount} Observer{observersEnding}";
                rowData.ObserversCount.Should().Be(observersCountText);
            }

            var wingersCount = participantResponses.Count(x => x.HearingRoleName == "Winger");
            if (wingersCount > 0)
            {
                var wingersEnding = wingersCount > 1 ? "s" : "";
                var wingersCountText = $"{wingersCount} Winger{wingersEnding}";
                rowData.WingersCount.Should().Be(wingersCountText);
            }
        }
    }
}
