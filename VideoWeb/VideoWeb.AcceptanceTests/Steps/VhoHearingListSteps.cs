//using Microsoft.JSInterop;
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
    public class VhoHearingListSteps : ISteps
    {
        private readonly Dictionary<UserDto, UserBrowser> _browsers;
        private readonly TestContext _c;

        public VhoHearingListSteps(Dictionary<UserDto, UserBrowser> browsers, TestContext testContext)
        {
            _browsers = browsers;
            _c = testContext;
        }

        [When(@"the VHO selects the hearing")]
        public void ProgressToNextPage()
        {
            Scrolling.ScrollToTheHearing(_browsers[_c.CurrentUser], _c.Test.Conference.Id);
            _browsers[_c.CurrentUser].Click(VhoHearingListPage.SelectHearingButton(_c.Test.Conference.Id));
            Scrolling.ScrollToTheTopOfThePage(_browsers[_c.CurrentUser]);
            _browsers[_c.CurrentUser].Click(VhoHearingListPage.HearingsTabButton);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(AdminPanelPage.ParticipantStatusTable, 60).Displayed.Should().BeTrue();
        }

        [When(@"the Video Hearings Officer clicks (.*)")]
        public void WhenTheVideoHearingsOfficerClicks(string elementName)
        {
            var action = new Actions(_browsers[_c.CurrentUser].Driver.WrappedDriver);
            var hearinglinkHover = _browsers[_c.CurrentUser].Driver.FindElement(VhoHearingListPage.HearingLinkHover(_c.Test.Conference.Id.ToString()));
            action.MoveToElement(hearinglinkHover).Click().Perform();
            switch (elementName)
            {
                case "Hearing ID":
                    _browsers[_c.CurrentUser].Click(VhoHearingListPage.CopyConferenceID(_c.Test.Conference.Id.ToString()));
                    break;
                case "QuickLink Details":
                    _browsers[_c.CurrentUser].Click(VhoHearingListPage.CopyQuickLink(_c.Test.Conference.Id.ToString()));
                    break;
                case "Phone Details":
                    _browsers[_c.CurrentUser].Click(VhoHearingListPage.CopyTelephoneID(_c.Test.Conference.Id.ToString()));
                    break;
            }
        }

        [Then(@"the VHO can see a list of hearings including the new hearing")]
        public void ThenTheVhoCanSeeAListOfHearingsIncludingTheNewHearing()
        {
            Scrolling.ScrollToTheHearing(_browsers[_c.CurrentUser], _c.Test.Conference.Id);

            var hearingThatShouldBeVisible = _c.Test.Conferences.First();

            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(VhoHearingListPage.CaseName(hearingThatShouldBeVisible.Id)).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(VhoHearingListPage.CaseNumber(hearingThatShouldBeVisible.Id)).Displayed.Should().BeTrue();
            var timespan = TimeSpan.FromMinutes(hearingThatShouldBeVisible.ScheduledDuration);
            var listedFor = DateTimeToString.GetListedForTimeAsString(timespan);
            _browsers[_c.CurrentUser].TextOf(VhoHearingListPage.HearingTime(hearingThatShouldBeVisible.Id))
                .Should().Be($"{_c.TimeZone.Adjust(hearingThatShouldBeVisible.ScheduledDateTime):HH:mm}");
            _browsers[_c.CurrentUser].TextOf(VhoHearingListPage.ListedFor(hearingThatShouldBeVisible.Id))
                .Should().Be($"{listedFor}");
            Scrolling.ScrollToTheTopOfThePage(_browsers[_c.CurrentUser]);
        }

        [Then(@"the VHO can see the hearing view")]
        public void ThenTheVhoCanSeeTheHearingView()
        {
            Scrolling.ScrollToTheTopOfThePage(_browsers[_c.CurrentUser]);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(AdminPanelPage.ParticipantStatusTable, 60).Displayed.Should().BeTrue();
        }

        [Then(@"the VHO should see the participant contact details")]
        public void ThenTheVhoShouldSeeTheParticipantContactDetails()
        {
            Scrolling.ScrollToTheTopOfThePage(_browsers[_c.CurrentUser]);
            var hearingParticipants = _c.Test.HearingParticipants.FindAll(x => x.UserRoleName.Equals("Individual") || x.UserRoleName.Equals("Representative"));
            var hearingParticipant = hearingParticipants.First();
            var conferenceParticipant = _c.Test.ConferenceParticipants.Find(x => x.Name.Contains(hearingParticipant.LastName));
            var firstParticipantLink = _browsers[_c.CurrentUser].Driver.WaitUntilVisible(VhoHearingListPage.ParticipantContactLink(conferenceParticipant.Id));
            firstParticipantLink.Displayed.Should().BeTrue();
            var action = new Actions(_browsers[_c.CurrentUser].Driver.WrappedDriver);
            action.MoveToElement(firstParticipantLink).Perform();
            if (_c.VideoWebConfig.TestConfig.TargetBrowser == TargetBrowser.Safari) return; // Latest version of Safari Driver will not hover over the correct element
            TheToolTipDetailsAreDisplayed(conferenceParticipant, hearingParticipant);
        }

        [Then(@"the (.*) is in the clipboard")]
        public void ThenTheIsInTheClipboard(string elementName)
        {
            //var clipboardText = _jsRuntime.InvokeAsync<string>("navigator.clipboard.readText");
            var clipboardText = _browsers[_c.CurrentUser].Driver.ExecuteAsyncScript("setTimeout(async () => { await navigator.clipboard.readText(); }, 5000);");
            //var clipboardText = _browsers[_c.CurrentUser].Driver.

            switch (elementName)
            {
                case "Hearing ID":
                    break;
                case "QuickLink Details":
                    break;
                case "Phone Details":
                    var id = _c.Test.Conference.MeetingRoom.TelephoneConferenceId;
                    break;
            }
        }

        private void TheToolTipDetailsAreDisplayed(ParticipantDetailsResponse participant, ParticipantResponse hearingParticipant)
        {
            var participantEmailAndRole = $"{participant.Name}";
            _browsers[_c.CurrentUser].TextOf(VhoHearingListPage.ParticipantContactName(participant.Id)).Should().Be(participantEmailAndRole);
            _browsers[_c.CurrentUser].TextOf(VhoHearingListPage.ParticipantContactEmail(participant.Id)).Should().Be(hearingParticipant.ContactEmail);
            _browsers[_c.CurrentUser].TextOf(VhoHearingListPage.ParticipantContactPhone(participant.Id)).Should().Be(hearingParticipant.TelephoneNumber);
        }


    }
}
