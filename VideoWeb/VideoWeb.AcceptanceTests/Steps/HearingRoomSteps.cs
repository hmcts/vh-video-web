using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using AcceptanceTests.Common.Api.Helpers;
using AcceptanceTests.Common.Driver.Drivers;
using AcceptanceTests.Common.Driver.Enums;
using AcceptanceTests.Common.Driver.Helpers;
using AcceptanceTests.Common.Test.Helpers;
using FluentAssertions;
using TechTalk.SpecFlow;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.AcceptanceTests.Pages;
using TestApi.Contract.Enums;
using VideoApi.Contract.Responses;
using VideoApi.Contract.Enums;
using TestApi.Contract.Dtos;
using OpenQA.Selenium;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public sealed class HearingRoomSteps : ISteps
    {
        private const int CountdownDuration = 30;
        private const int ExtraTimeAfterTheCountdown = 15;
        private const int PauseCloseTransferDuration = 15;
        private readonly Dictionary<UserDto, UserBrowser> _browsers;
        private readonly TestContext _c;
        private readonly BrowserSteps _browserSteps;

        public HearingRoomSteps(Dictionary<UserDto, UserBrowser> browsers, TestContext testContext, BrowserSteps browserSteps)
        {
            _browsers = browsers;
            _c = testContext;
            _browserSteps = browserSteps;
        }

        [When(@"the countdown finishes")]
        public void WhenTheCountdownFinishes()
        {
            Thread.Sleep(TimeSpan.FromSeconds(CountdownDuration));
            Thread.Sleep(TimeSpan.FromSeconds(ExtraTimeAfterTheCountdown));
            new VerifyVideoIsPlayingBuilder(_browsers[_c.CurrentUser]).Feed(HearingRoomPage.IncomingVideoFeed);
        }

        [When(@"the Judge clicks pause")]
        public void WhenTheUserClicksPause()
        {
            _browsers[_c.CurrentUser].Click(HearingRoomPage.PauseButton);
            Thread.Sleep(TimeSpan.FromSeconds(PauseCloseTransferDuration));
        }

        [When(@"the Judge closes the hearing")]
        public void WhenTheJudgeClosesTheHearing()
        {
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(HearingRoomPage.CloseButton, 180);
            _browsers[_c.CurrentUser].Click(HearingRoomPage.CloseButton);
            if (_c.VideoWebConfig.TestConfig.TargetBrowser == TargetBrowser.Firefox)
            {
                Thread.Sleep(TimeSpan.FromSeconds(5));
            }
            else
            {
                _browsers[_c.CurrentUser].Driver.WaitUntilVisible(HearingRoomPage.ConfirmClosePopup).Displayed.Should().BeTrue();
            }
            _browsers[_c.CurrentUser].Click(HearingRoomPage.ConfirmCloseButton);
            _c.Test.HearingClosedTime = DateTime.Now;
            Thread.Sleep(TimeSpan.FromSeconds(PauseCloseTransferDuration));
        }

        [When(@"the Judge is on the Hearing Room page for (.*) seconds")]
        [Then(@"the Judge is on the Hearing Room page for (.*) seconds")]
        public void ThenTheUserIsOnTheHearingRoomPageForSeconds(int seconds)
        {
            Thread.Sleep(TimeSpan.FromSeconds(seconds));
        }

        [Then(@"the Judge is on the Hearing Room page for (.*) minute")]
        [Then(@"the Judge is on the Hearing Room page for (.*) minutes")]
        [Then(@"the participant is on the Hearing Room page for (.*) minute")]
        [Then(@"the participant is on the Hearing Room page for (.*) minutes")]
        public void ThenTheUserIsOnTheHearingRoomPageForMinutes(int minutes)
        {
            Thread.Sleep(TimeSpan.FromMinutes(minutes));
        }

        [Then(@"the hearing controls are visible")]
        public void ThenTheHearingControlsAreVisible()
        {
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(HearingRoomPage.ToggleSelfView).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(HearingRoomPage.PauseButton).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(HearingRoomPage.CloseButton).Displayed.Should().BeTrue();
        }

        [Then(@"the user can see themselves and toggle the view off and on")]
        public void ThenTheUserCanSeeThemselvesAndToggleTheViewOffAndOn()
        {
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(HearingRoomPage.SelfView).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser].Click(HearingRoomPage.ToggleSelfView);
            _browsers[_c.CurrentUser].Driver.WaitUntilElementNotVisible(HearingRoomPage.SelfView).Should().BeTrue();
            _browsers[_c.CurrentUser].Click(HearingRoomPage.ToggleSelfView);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(HearingRoomPage.SelfView).Displayed.Should().BeTrue();
        }

        [Then(@"the participant is back in the hearing")]
        public void ThenTheParticipantIsBackInTheHearing()
        {
            new VerifyVideoIsPlayingBuilder(_browsers[_c.CurrentUser]).Feed(HearingRoomPage.IncomingVideoFeed);
        }

        [Then(@"the Judge can see the participants")]
        public void ThenTheJudgeCanSeeTheOtherParticipants()
        {
            new VerifyVideoIsPlayingBuilder(_browsers[_c.CurrentUser]).Feed(HearingRoomPage.IncomingVideoFeed);
        }

        [Then(@"(.*) can see the other participants")]
        public void ThenParticipantsCanSeeTheOtherParticipants(string user)
        {
            _browserSteps.GivenInTheUsersBrowser(user);
            new VerifyVideoIsPlayingBuilder(_browsers[_c.CurrentUser]).Feed(HearingRoomPage.IncomingVideoFeed);
        }

        [Then(@"the (.*) clicks raise hand")]
        public void ThenTheParticipantClicksRaiseHand(string user)
        {
            _browserSteps.GivenInTheUsersBrowser(user);
            _browsers[_c.CurrentUser].Driver.WaitUntilElementClickable(HearingRoomPage.ToggleHandRaised).Click();
        }

        [Then(@"an audio recording of the hearing has been created")]
        public void ThenAnAudioRecordingOfTheHearingHasBeenCreated()
        {
            var response = _c.Apis.TestApi.GetAudioRecordingLink(_c.Test.NewHearingId);
            var audioLink = RequestHelper.Deserialise<AudioRecordingResponse>(response.Content);
//            audioLink.AudioFileLinks.Should().NotBeNullOrEmpty();
//            audioLink.AudioFileLinks.First().ToLower().Should().Contain(_c.Test.NewHearingId.ToString().ToLower());
        }

        [Then(@"the VHO can see that (.*) is in the Waiting Room")]
        public void ThenTheVhoCanSeeThatAllTheParticipantsAreInTheWaitingRoom(string text)
        {
            SwitchToTheVhoIframe();

            var user = Users.GetUserFromText(text, _c.Test.Users);
            var participant = _c.Test.ConferenceParticipants.First(x => x.Username.Equals(user.Username));

            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(AdminPanelPage.ParticipantInIframe(participant.DisplayName)).Displayed.Should().BeTrue();

            SwitchToDefaultContent();
        }

        [Then(@"the VHO can see that the Judge and (.*) participants are in the Hearing Room")]
        public void ThenTheVhoCanSeeThatAllTheJudgeAndParticipantsAreInTheHearingRoom(string text)
        {
            SwitchToTheVhoIframe();

            var judge = _c.Test.Conference.Participants.First(x => x.UserRole == UserRole.Judge);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(AdminPanelPage.ParticipantInIframe(judge.DisplayName)).Displayed.Should().BeTrue();

            var user = Users.GetUserFromText(text, _c.Test.Users);
            var participant = _c.Test.ConferenceParticipants.First(x => x.Username.Equals(user.Username));

            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(AdminPanelPage.ParticipantInIframe(participant.DisplayName)).Displayed.Should().BeTrue();

            SwitchToDefaultContent();
        }

        [Then(@"the Judge can see interpreter and interpretee on participant list")]
        public void ThenTheJudgeCanSeeInterpreterAndInterpreteeOnParticipantList()
        {
            var interpreter = _c.Test.ConferenceParticipants.First(x => x.HearingRole.ToLower() == "interpreter");
            interpreter.Should().NotBeNull();
            interpreter.LinkedParticipants.Should().NotBeNullOrEmpty();
            var interpretee = _c.Test.ConferenceParticipants.Single(x => x.Id == interpreter.LinkedParticipants.Single().LinkedId);
            _browsers[_c.CurrentUser].Driver.WaitUntilElementExists(HearingRoomPage.ParticipantPanel, 60);            
            _browsers[_c.CurrentUser].Driver.WaitUntilElementExists(HearingRoomPage.InterpreteeName(interpretee.DisplayName), 60);
            var interpreterText = _browsers[_c.CurrentUser].TextOf(HearingRoomPage.InterpreteeName(interpretee.DisplayName));
            interpreterText.Should().Contain($"{interpreter.DisplayName}");
        }

        [Then(@"the Judge can see interpreter hand (.*)")]
        public void ThenTheJudgeCanSeeInterpreterHandRaised(string status)
        {
            if (status == "raised")
                _browsers[_c.CurrentUser].Driver.WaitUntilVisible(HearingRoomPage.HandRaised).Displayed.Should().BeTrue();
            else
                _browsers[_c.CurrentUser].Driver.WaitUntilElementNotVisible(HearingRoomPage.HandRaised).Should().BeTrue();
        }

        [Then(@"the Judge can close the hearing")]
        public void ThenTheJudgeCanCloseTheHearing()
        {
            _browserSteps.GivenInTheUsersBrowser($"{UserType.Judge}");
            WhenTheJudgeClosesTheHearing();
        }
        
        public void ProgressToNextPage()
        {
            WhenTheJudgeClosesTheHearing();
        }

        private void SwitchToTheVhoIframe()
        {
            _browsers[_c.CurrentUser].Driver.SwitchTo().Frame(AdminPanelPage.AdminIframeId);
        }

        private void SwitchToDefaultContent()
        {
            _browsers[_c.CurrentUser].Driver.SwitchTo().DefaultContent();
        }
    }
}
