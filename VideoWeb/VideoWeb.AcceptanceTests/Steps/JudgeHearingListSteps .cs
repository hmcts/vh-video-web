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
using TestApi.Contract.Dtos;
using VideoApi.Contract.Responses;
using BookingsApi.Contract.Responses;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public class JudgeHearingListSteps : ISteps
    {
        private readonly Dictionary<UserDto, UserBrowser> _browsers;
        private readonly TestContext _c;

        public JudgeHearingListSteps(Dictionary<UserDto, UserBrowser> browsers, TestContext testContext)
        {
            _browsers = browsers;
            _c = testContext;
        }

        public void ProgressToNextPage()
        {
            if (_c.Test.SelfTestJourney)
            {
                WhenTheJudgeClicksTheCheckEquipmentButton();
            }
            else
                {
                var caseNameElement = JudgeHearingListPage.CaseName(_c.Test.Conference.Id);
                _browsers[_c.CurrentUser].Driver.WaitUntilVisible(caseNameElement, Convert.ToInt32(_c.VideoWebConfig.consultationRoomTimeout));
                _browsers[_c.CurrentUser].ScrollTo(caseNameElement);
                _browsers[_c.CurrentUser].Click(JudgeHearingListPage.StartHearingButton(_c.Test.Conference.Id));
                Scrolling.ScrollToTheTopOfThePage(_browsers[_c.CurrentUser]);
                _browsers[_c.CurrentUser].Driver.WaitUntilVisible(WaitingRoomPage.HearingCaseDetails, 60).Displayed.Should().BeTrue();
                }
        }
        public void WhenTheJudgeClicksTheCheckEquipmentButton()
        {
            _browsers[_c.CurrentUser].Click(JudgeHearingListPage.CheckEquipmentButton);
        }


        public void ThenTheVhoCanSeeAListOfHearingsIncludingTheNewHearing()
        {
            Scrolling.ScrollToTheHearing(_browsers[_c.CurrentUser], _c.Test.Conference.Id);

            var hearingThatShouldBeVisible = _c.Test.Conferences.First();

            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(JudgeHearingListPage.CaseName(hearingThatShouldBeVisible.Id)).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(JudgeHearingListPage.CaseNumber(hearingThatShouldBeVisible.Id)).Displayed.Should().BeTrue();
            var timespan = TimeSpan.FromMinutes(hearingThatShouldBeVisible.ScheduledDuration);
            var listedFor = DateTimeToString.GetListedForTimeAsString(timespan);
            Scrolling.ScrollToTheTopOfThePage(_browsers[_c.CurrentUser]);
        }

        public void ThenTheVhoCanSeeTheHearingView()
        {
            Scrolling.ScrollToTheTopOfThePage(_browsers[_c.CurrentUser]);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(AdminPanelPage.ParticipantStatusTable, 60).Displayed.Should().BeTrue();
        }

        public void ThenTheVhoShouldSeeTheParticipantContactDetails()
        {
            Scrolling.ScrollToTheTopOfThePage(_browsers[_c.CurrentUser]);
            var hearingParticipants = _c.Test.HearingParticipants.FindAll(x => x.UserRoleName.Equals("Individual") || x.UserRoleName.Equals("Representative"));
            var hearingParticipant = hearingParticipants.First();
            var conferenceParticipant = _c.Test.ConferenceParticipants.Find(x => x.Name.Contains(hearingParticipant.LastName));
            var action = new Actions(_browsers[_c.CurrentUser].Driver.WrappedDriver);
            if (_c.VideoWebConfig.TestConfig.TargetBrowser == TargetBrowser.Safari) return; // Latest version of Safari Driver will not hover over the correct element
            TheToolTipDetailsAreDisplayed(conferenceParticipant, hearingParticipant);
        }

        private void TheToolTipDetailsAreDisplayed(ParticipantDetailsResponse participant, ParticipantResponse hearingParticipant)
        {
            var participantEmailAndRole = $"{participant.Name}";
        }
    }
}
