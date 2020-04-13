using System.Collections.Generic;
using System.Linq;
using AcceptanceTests.Common.Driver.Browser;
using AcceptanceTests.Common.Driver.Helpers;
using FluentAssertions;
using TechTalk.SpecFlow;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.AcceptanceTests.Pages;
using VideoWeb.Common.Models;
using VideoWeb.Services.Video;
using RoomType = VideoWeb.EventHub.Enums.RoomType;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public class FiltersSteps
    {
        private readonly TestContext _c;
        private readonly Dictionary<string, UserBrowser> _browsers;
        private readonly HearingAlertsSteps _alertsSteps;
        public FiltersSteps(TestContext c, HearingAlertsSteps alertsSteps, Dictionary<string, UserBrowser> browsers)
        {
            _c = c;
            _alertsSteps = alertsSteps;
            _browsers = browsers;
        }

        [Given(@"the hearing has every type of alert")]
        public void GivenTheHearingHasEveryTypeOfAlert()
        {
            var participant = GetUserFromConferenceDetails("Individual");
            _alertsSteps.WhenTheJudgeHasSuspendedTheHearing();
            _alertsSteps.WhenAParticipantHasDisconnectedFromTheHearing(participant.Id.ToString(), RoomType.WaitingRoom);
            _alertsSteps.WhenAParticipantHasChosenToBlockUserMedia();
            _alertsSteps.WhenAParticipantHasFailedTheSelfTestWithReason("Failed self-test (Camera)");
        }

        private ParticipantDetailsResponse GetUserFromConferenceDetails(string userRole)
        {
            var participantUser = userRole.ToLower().Equals("judge") || userRole.ToLower().Equals("clerk")
                ? _c.Test.ConferenceParticipants.Find(x => x.User_role.ToString().Equals(Role.Judge.ToString()))
                : _c.Test.ConferenceParticipants.Find(x => x.User_role.ToString().Equals(Role.Individual.ToString()));
            return participantUser;
        }

        [When(@"the user filters by alert with the option (.*)")]
        [When(@"the user filters by location with the option (.*)")]
        [When(@"the user filters by status with the option (.*)")]
        [When(@"the user filters by alert with the options (.*)")]
        [When(@"the user filters by location with the options (.*)")]
        [When(@"the user filters by status with the options (.*)")]
        public void VhoFilter(string options)
        {
            _browsers[_c.CurrentUser.Key].Click(VhoHearingListPage.FiltersButton);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(FiltersPopupPage.FiltersPopup).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser.Key].ClickLink(FiltersPopupPage.ClearFiltersLink);
            foreach (var option in ConvertStringIntoArray(options))
            {
                _browsers[_c.CurrentUser.Key].ClickCheckbox(FiltersPopupPage.CheckBox(option));
            }
            _browsers[_c.CurrentUser.Key].Click(FiltersPopupPage.ApplyButton);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilElementNotVisible(FiltersPopupPage.FiltersPopup).Should().BeTrue();
            _browsers[_c.CurrentUser.Key].Refresh();
        }

        private static IEnumerable<string> ConvertStringIntoArray(string options)
        {
            return options.Split(",");
        }

        [Then(@"the hearings are filtered")]
        public void ThenTheHearingsAreFiltered()
        {
            var hearingThatShouldNotBeVisible = _c.Test.Conferences.First();
            var hearingThatShouldBeVisible = _c.Test.Conferences.Last();
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(VhoHearingListPage.CaseName(hearingThatShouldBeVisible.Id)).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilElementNotVisible(VhoHearingListPage.CaseName(hearingThatShouldNotBeVisible.Id)).Should().BeTrue();
        }
    }
}
