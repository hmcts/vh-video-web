using System;
using System.Collections.Generic;
using System.Threading;
using AcceptanceTests.Common.Driver.Drivers;
using AcceptanceTests.Common.Driver.Helpers;
using AcceptanceTests.Common.Test.Helpers;
using FluentAssertions;
using TechTalk.SpecFlow;
using VideoWeb.AcceptanceTests.Api;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.AcceptanceTests.Pages;
using TestApi.Contract.Dtos;
using VideoApi.Contract.Enums;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public class JudgePrivateConsultationSteps
    {
        private readonly Dictionary<UserDto, UserBrowser> _browsers;
        private readonly TestContext _c;
        private readonly ProgressionSteps _progressionSteps;
        private readonly DataSetupSteps _dataSetupSteps;
        private readonly BrowserSteps _browserSteps;
        private readonly HearingRoomSteps _hearingRoomSteps;
        private const int MaxRetries = 30;

        public JudgePrivateConsultationSteps(Dictionary<UserDto, UserBrowser> browsers, TestContext testContext, 
            ProgressionSteps progressionSteps, DataSetupSteps dataSetupSteps, BrowserSteps browserSteps,
            HearingRoomSteps hearingRoomSteps)
        {
            _browsers = browsers;
            _c = testContext;
            _progressionSteps = progressionSteps;
            _dataSetupSteps = dataSetupSteps;
            _browserSteps = browserSteps;
            _hearingRoomSteps = hearingRoomSteps;
        }

        [Given(@"the (.*) user has entered the private consultation room")]
        [When(@"the (.*) user has entered the private consultation room")]
        public void GivenTheUserHasEnteredThePrivateConsultationRoom(string user)
        {
            _progressionSteps.GivenIAmOnThePage(user, "Waiting Room");
            WhenTheyEnterPrivateConsultationRoom();
        }

        [Given(@"the (.*) user has also entered the private consultation room")]
        public void GivenTheUserHasAlsoEnteredThePrivateConsultationRoom(string user)
        {
            _progressionSteps.GivenHearingExistsAndIAmOnThePage(user, "Waiting Room");
            WhenTheyEnterPrivateConsultationRoom();
        }

        [Given(@"a Panel Member is in the waiting room")]
        public void GivenAPanelMemberIsInTheWaitingRoom()
        {
            _dataSetupSteps.GivenIHaveAHearingWithUser("panel member");
            _progressionSteps.GivenHearingExistsAndIAmOnThePage("panel member", "Waiting Room");
        }

        [Given(@"a Panel Member has entered the private consultation room")]
        public void GivenAPanelMemberStartedAPrivateConsultationRoom()
        {
            GivenAPanelMemberIsInTheWaitingRoom();
            WhenTheyEnterPrivateConsultationRoom();
        }

        [Given(@"a Winger is in the waiting room")]
        public void GivenAWingerIsInTheWaitingRoom()
        {
            _dataSetupSteps.GivenIHaveAHearingWithUser("winger");
            _progressionSteps.GivenHearingExistsAndIAmOnThePage("winger", "Waiting Room");
        }
        
        [Given(@"a Winger has entered the private consultation room")]
        public void GivenAWingerEnteredThePrivateConsultationRoom()
        {
            GivenAWingerIsInTheWaitingRoom();
            WhenTheyEnterPrivateConsultationRoom();
        }

        [When(@"(?:he|she|they) (?:enter|enters) the private consultation room")]
        public void WhenTheyEnterPrivateConsultationRoom()
        {
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(JudgeWaitingRoomPage.HearingTitle).Displayed.Should().BeTrue();
            WaitForUserStatusToBe(ParticipantState.Available);
            var ready = _c.Test.Conference.CurrentStatus;
            _browsers[_c.CurrentUser].Click(JudgeWaitingRoomPage.EnterPrivateConsultationButton);
            //_browsers[_c.CurrentUser].Driver.WaitUntilElementNotVisible(JudgeWaitingRoomPage.PleaseWaitText, 20);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(PrivateConsultationRoomPage.LeavePrivateConsultationButton, 60).Displayed.Should().BeTrue();
            WaitForUserStatusToBe(ParticipantState.InConsultation);
        }

        [When(@"the (.*) user leaves the private consultation")]
        public void WhenTheyLeaveTheConsultationRoom(string user)
        {
            _browserSteps.GivenInTheUsersBrowser(user);
            _browsers[_c.CurrentUser].Click(PrivateConsultationRoomPage.LeavePrivateConsultationButton);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(PrivateConsultationRoomPage.ConfirmLeavePrivateConsultationButton).Click();
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(JudgeWaitingRoomPage.HearingTitle).Displayed.Should().BeTrue();
        }
        
        [When(@"(?:he|she|they) (?:mute|mutes|unmute) their microphone")]
        public void WhenTheyToggleTheMuteIcon()
        {
            _browsers[_c.CurrentUser].Click(PrivateConsultationRoomPage.ToggleMute);
        }

        [When(@"(?:he|she|they) (?:hide|hides|show) their self view")]
        public void WhenTheyToggleTheSelfViewIcon()
        {
            _browsers[_c.CurrentUser].Click(PrivateConsultationRoomPage.ToggleSelfViewButton);
        }
        
        [Then(@"(?:he|she|they) will be transferred to the private consultation room")]
        public void ThenTheyWillBeInThePrivateConsultationRoom()
        {
            new VerifyVideoIsPlayingBuilder(_browsers[_c.CurrentUser])
                .Feed(PrivateConsultationRoomPage.IncomingFeed);
        }

        [Then(@"(?:he|she|they) can leave the private consultation room")]
        public void ThenTheyCanLeaveThePrivateConsultation()
        {
            _browsers[_c.CurrentUser].Click(PrivateConsultationRoomPage.LeavePrivateConsultationButton);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(PrivateConsultationRoomPage.ConfirmLeavePrivateConsultationButton).Click();
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(JudgeWaitingRoomPage.HearingTitle).Displayed.Should().BeTrue();
        }

        [Then(@"the (.*) can leave the private consultation room")]
        public void ThenTheUserCanLeaveThePrivateConsultation(string user)
        {
            _browserSteps.GivenInTheUsersBrowser(user);
            ThenTheyCanLeaveThePrivateConsultation();
        }
        
        [Then(@"their microphone will be muted")]
        public void ThenTheirMicrophoneWillBeMuted()
        {
            _browsers[_c.CurrentUser].Driver.FindElement(PrivateConsultationRoomPage.ToggleMute).GetAttribute("class")
                .Should().EndWith(PrivateConsultationRoomPage.ToggleMuteMicOff);
        }

        [Then(@"their microphone will not be muted")]
        public void ThenTheirMicrophoneWillNotBeMuted()
        {
            _browsers[_c.CurrentUser].Driver.FindElement(PrivateConsultationRoomPage.ToggleMute).GetAttribute("class")
                .Should().EndWith(PrivateConsultationRoomPage.ToggleMuteMicOn);
        }

        [Then(@"(?:he|she|they) can unmute their microphone")]
        public void ThenTheyCanUnMuteTheirMicrophone()
        {
            WhenTheyToggleTheMuteIcon();
            ThenTheirMicrophoneWillNotBeMuted();
        }

        [Then(@"(?:he|she|they) can mute their microphone")]
        public void ThenTheyCanMuteTheirMicrophone()
        {
            WhenTheyToggleTheMuteIcon();
            ThenTheirMicrophoneWillBeMuted();
        }

        [Then(@"their self view will be hidden")]
        public void ThenTheirSelfViewWillBeHidden()
        {
            _browsers[_c.CurrentUser].Driver.WaitUntilElementNotVisible(PrivateConsultationRoomPage.SelfViewVideo);
            _browsers[_c.CurrentUser].Driver.FindElement(PrivateConsultationRoomPage.ToggleSelfViewButton).GetAttribute("class")
                .Should().EndWith(PrivateConsultationRoomPage.ToggleSelfViewHide);
            _browsers[_c.CurrentUser].IsDisplayed(PrivateConsultationRoomPage.SelfViewVideo).Should().BeFalse();
        }

        [Then(@"their self view will be displayed")]
        public void ThenTheirSelfViewWillBeShown()
        {
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(PrivateConsultationRoomPage.SelfViewVideo);
            _browsers[_c.CurrentUser].Driver.FindElement(PrivateConsultationRoomPage.ToggleSelfViewButton).GetAttribute("class")
                .Should().EndWith(PrivateConsultationRoomPage.ToggleSelfViewShow);
            _browsers[_c.CurrentUser].IsDisplayed(PrivateConsultationRoomPage.SelfViewVideo).Should().BeTrue();
        }

        [Then(@"(?:he|she|they) can view their self view")]
        public void ThenTheyCanViewTheirSelfView()
        {
            WhenTheyToggleTheSelfViewIcon();
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(PrivateConsultationRoomPage.SelfViewVideo);
            _browsers[_c.CurrentUser].Driver.FindElement(PrivateConsultationRoomPage.ToggleSelfViewButton).GetAttribute("class")
                .Should().EndWith(PrivateConsultationRoomPage.ToggleSelfViewShow);
            _browsers[_c.CurrentUser].IsDisplayed(PrivateConsultationRoomPage.SelfViewVideo).Should().BeTrue();
        }

        [Then(@"(?:he|she|they) can hide their self view")]
        public void ThenTheyCanHideTheirSelfView()
        {
            WhenTheyToggleTheSelfViewIcon();
            _browsers[_c.CurrentUser].Driver.WaitUntilElementNotVisible(PrivateConsultationRoomPage.SelfViewVideo);
            _browsers[_c.CurrentUser].Driver.FindElement(PrivateConsultationRoomPage.ToggleSelfViewButton).GetAttribute("class")
                .Should().EndWith(PrivateConsultationRoomPage.ToggleSelfViewHide);
            _browsers[_c.CurrentUser].IsDisplayed(PrivateConsultationRoomPage.SelfViewVideo).Should().BeFalse();
        }

        [Then(@"the (.*) user remains in the private consultation room")]
        public void ThenTheUserShouldRemainInTheWaitingRoom(string user)
        {
            _browserSteps.GivenInTheUsersBrowser(user);
            Thread.Sleep(TimeSpan.FromSeconds(10));
            ThenTheyWillBeInThePrivateConsultationRoom();
        }

        [Then(@"the (.*) is transferred to the Hearing Room")]
        public void ThenTheUserIsTransferredToTheHearingRoom(string user)
        {
            _browserSteps.GivenInTheUsersBrowser(user);
            _browsers[_c.CurrentUser].Driver.WaitUntilElementClickable(HearingRoomPage.ToggleAudioMuteLocked);
            _hearingRoomSteps.ThenParticipantsCanSeeTheOtherParticipants(user);
        }

        private void WaitForUserStatusToBe(ParticipantState participantState)
        {
            new PollForParticipantStatus(_c.Apis.TestApi)
                .WithConferenceId(_c.Test.NewConferenceId)
                .WithParticipant(_c.CurrentUser.Username)
                .WithExpectedState(participantState)
                .Retries(MaxRetries)
                .Poll();
        }
    }
}
