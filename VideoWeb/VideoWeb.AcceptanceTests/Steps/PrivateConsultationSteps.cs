using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using AcceptanceTests.Common.Driver.Drivers;
using AcceptanceTests.Common.Driver.Helpers;
using AcceptanceTests.Common.Test.Helpers;
using FluentAssertions;
using OpenQA.Selenium;
using TechTalk.SpecFlow;
using VideoWeb.AcceptanceTests.Api;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.AcceptanceTests.Pages;
using VideoWeb.Services.TestApi;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public class PrivateConsultationSteps
    {
        private const int SecondsWaitForTheLinkToAppear = 5;
        private const int SecondsWaitToCallAndAnswer = 15;
        private const int SecondsWaitForTransfer = 5;
        private const int ExtraTimeToConnectTheParticipantsInSaucelabs = 300;
        private readonly Dictionary<UserDto, UserBrowser> _browsers;
        private readonly TestContext _c;
        private readonly BrowserSteps _browserSteps;
        private readonly ProgressionSteps _progressionSteps;
        private const int MaxRetries = 30;

        public PrivateConsultationSteps(Dictionary<UserDto, UserBrowser> browsers, TestContext testContext, BrowserSteps browserSteps, ProgressionSteps progressionSteps)
        {
            _browsers = browsers;
            _c = testContext;
            _browserSteps = browserSteps;
            _progressionSteps = progressionSteps;
        }

        [Given(@"the (.*) and the (.*) are in a private consultation room")]
        public void GivenAUserIsInPrivateConsultationWithAnotherUser(string user1, string user2)
        {
            _progressionSteps.GivenTwoUsersAreInTheWaitingRoomForHearingInMinutesTime(user1, user2, 10);
            WhenAUserStartsAPrivateConsultationWithAnotherUser(user1, user2);
            WhenTheUserAcceptsThePrivateConsultation(user2, user1);
        }

        [Given(@"the (.*) and the (.*) are in a locked private consultation room")]
        public void GivenAUserIsInALockedPrivateConsultationWithAnotherUser(string user1, string user2)
        {
            GivenAUserIsInPrivateConsultationWithAnotherUser(user1, user2);
            _browserSteps.GivenInTheUsersBrowser(user1);
            _browsers[_c.CurrentUser].Click(PrivateConsultationRoomPage.LockButton);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(PrivateConsultationRoomPage.LockedBadge);
        }

        [When(@"the (.*) starts a private consultation with (?:the|their) (.*)")]
        public void WhenAUserStartsAPrivateConsultationWithAnotherUser(string user1, string user2)
        {
            _browserSteps.GivenInTheUsersBrowser(user1);
            var user = Users.GetUserFromText(user2, _c.Test.Users);
            var participant = _c.Test.ConferenceParticipants.First(x => x.Username.ToLower().Contains(user.Username.ToLower()));
            WaitForUserToBeInState(participant.Username, ParticipantState.Available, ParticipantState.InConsultation);
            _browsers[_c.CurrentUser].Click(WaitingRoomPage.StartPrivateMeetingButton);
            _browsers[_c.CurrentUser].ClickCheckbox(WaitingRoomPage.InviteCheckboxFor(participant.Display_name));
            _browsers[_c.CurrentUser].Click(WaitingRoomPage.ContinueButton);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(PrivateConsultationRoomPage.IncomingFeed);
        }

        [When(@"they attempt to start a private consultation with no other participants")]
        public void WhenUserTriesToOpenPrivateConsultationWithoutOthers()
        {
            _browsers[_c.CurrentUser].Click(WaitingRoomPage.StartPrivateMeetingButton);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(WaitingRoomPage.ContinueButton);
        }

        [When(@"the user starts a private consultation with (.*)")]
        public void WhenTheUserStartsAPrivateConsultationWithIndividual(string text)
        {
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(WaitingRoomPage.TimePanel).Displayed.Should().BeTrue();
            Thread.Sleep(TimeSpan.FromSeconds(SecondsWaitToCallAndAnswer));
            var user = Users.GetUserFromText(text, _c.Test.Users);
            var participant = _c.Test.ConferenceParticipants.First(x => x.Username.ToLower().Contains(user.Username.ToLower()));
            _browsers[_c.CurrentUser].ClickLink(ParticipantListPanel.PrivateConsultationLink(participant.Id));
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(PrivateCallPopupPage.OutgoingCallMessage).Text.Should().Contain(participant.Name);
        }

        [When(@"the (.*) accepts the private consultation invite from the (.*)")]
        [When(@"(.*) accepts the private consultation from (.*)")]
        public void WhenTheUserAcceptsThePrivateConsultation(string user, string from)
        {
            _browserSteps.GivenInTheUsersBrowser(user);
            Thread.Sleep(TimeSpan.FromSeconds(SecondsWaitToCallAndAnswer));
            var fromUser = Users.GetUserFromText(from, _c.Test.Users);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(PrivateCallPopupPage.IncomingCallMessage).Text.Should().Contain(fromUser.Display_name);
            _browsers[_c.CurrentUser].Click(PrivateCallPopupPage.AcceptPrivateCall);
        }

        [When(@"the (.*) declines the private consultation invite from the (.*)")]
        public void WhenTheUserDeclinesThePrivateConsultation(string user, string from)
        {
            _browserSteps.GivenInTheUsersBrowser(user);
            Thread.Sleep(TimeSpan.FromSeconds(SecondsWaitToCallAndAnswer));
            var fromUser = Users.GetUserFromText(from, _c.Test.Users);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(PrivateCallPopupPage.IncomingCallMessage).Text.Should().Contain(fromUser.Display_name);
            _browsers[_c.CurrentUser].Click(PrivateCallPopupPage.DeclinePrivateCall);
        }

        [When(@"the (.*) joins the meeting room containing the (.*)")]
        public void WhenTheUserTriesToJoinAnotherUsersPrivateConsultation(string user1, string user2)
        {
            var user2MeetingRoom = TheMeetingRoomUserIsIn(user2);
            _browserSteps.GivenInTheUsersBrowser(user1);
            _browsers[_c.CurrentUser].Click(WaitingRoomPage.JoinPrivateMeetingButton);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(WaitingRoomPage.ContinueButton);
            _browsers[_c.CurrentUser].ClickRadioButton(WaitingRoomPage.MeetingRoomRadioButtonFor(user2MeetingRoom));
            _browsers[_c.CurrentUser].Click(WaitingRoomPage.ContinueButton);
        }
        
        [When(@"(.*) rejects the private consultation")]
        public void WhenTheUserRejectsThePrivateConsultation(string user)
        {
            _browserSteps.GivenInTheUsersBrowser(user);
            _browsers[_c.CurrentUser].Click(PrivateCallPopupPage.DeclinePrivateCall);
        }

        [When(@"a participant closes the private consultation")]
        public void WhenAParticipantClosesThePrivateConsultation()
        {
            _browsers[_c.CurrentUser].Click(PrivateCallPopupPage.ClosePrivateConsultationButton);
        }

        [When(@"the user does not answer after (.*) minutes")]
        public void WhenTheUserDoesNotAnswerAfterMinutes(int minutes)
        {
            Thread.Sleep(TimeSpan.FromMinutes(minutes));
        }

        [When(@"the (.*) user leaves the private consultation room")]
        public void WhenTheUserLeavesThePrivateConsultationRoom(string user)
        {
            _browserSteps.GivenInTheUsersBrowser(user);
            _browsers[_c.CurrentUser].Click(PrivateConsultationRoomPage.LeavePrivateConsultationButton);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(PrivateConsultationRoomPage.ConfirmLeavePrivateConsultationButton).Click();
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(WaitingRoomPage.HearingCaseDetails).Displayed.Should().BeTrue();
        }

        [Then(@"(.*) can see the other participant")]
        public void ThenTheParticipantsCanTalkToEachOther(string user)
        {
            _browserSteps.GivenInTheUsersBrowser(user);
            new VerifyVideoIsPlayingBuilder(_browsers[_c.CurrentUser])
                .DelayForVideoElementToAppear(ExtraTimeToConnectTheParticipantsInSaucelabs)
                .Feed(PrivateConsultationRoomPage.IncomingFeed);
        }

        [Then(@"the (.*) and (?:the|their) (.*) will be in the same private consultation room")]
        public void ThenTheUsersWillBeAbleToSeeEachOther(string user1, string user2)
        {
            var user = Users.GetUserFromText(user1, _c.Test.Users);
            var otherUser = Users.GetUserFromText(user2, _c.Test.Users);
            Thread.Sleep(TimeSpan.FromSeconds(SecondsWaitForTransfer));
            TheMeetingRoomUserIsIn(user1).Should().Be(TheMeetingRoomUserIsIn(user2));
            TheUsersListedInTheMeetingRoomSeenBy(user1).Should().Contain(user.Display_name, otherUser.Display_name);
            TheUsersListedInTheMeetingRoomSeenBy(user2).Should().Contain(user.Display_name, otherUser.Display_name);
            ThenTheParticipantsCanTalkToEachOther(user1);
            ThenTheParticipantsCanTalkToEachOther(user2);
        }

        [Then(@"the (.*) and (?:the|their) (.*) will not be in the same private consultation room")]
        public void ThenTheUsersWillNotBeAbleToSeeEachOther(string user1, string user2)
        {
            var user = Users.GetUserFromText(user1, _c.Test.Users);
            var otherUser = Users.GetUserFromText(user2, _c.Test.Users);
            Thread.Sleep(TimeSpan.FromSeconds(SecondsWaitForTransfer));
            TheMeetingRoomUserIsIn(user1).Should().NotBe(TheMeetingRoomUserIsIn(user2));
            TheUsersListedInTheMeetingRoomSeenBy(user1).Should().NotContain(otherUser.Display_name);
            TheUsersListedInTheMeetingRoomSeenBy(user2).Should().NotContain(user.Display_name);
        }
        
        [Then(@"the self view can be open and closed")]
        public void ThenTheSelfViewCanBeOpenAndClosed()
        {
            _browsers[_c.CurrentUser].Driver.WaitUntilElementNotVisible(PrivateConsultationRoomPage.SelfViewVideo).Should().BeTrue();
            _browsers[_c.CurrentUser].Click(PrivateConsultationRoomPage.ToggleSelfViewButton);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(PrivateConsultationRoomPage.SelfViewVideo).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser].Click(PrivateConsultationRoomPage.ToggleSelfViewButton);
            _browsers[_c.CurrentUser].Driver.WaitUntilElementNotVisible(PrivateConsultationRoomPage.SelfViewVideo).Should().BeTrue();
        }

        [Then(@"the (.*) user sees a message that the request has been rejected")]
        public void ThenTheRepresentativeUserSeesAMessageThatTheRequestHasBeenRejected(string user)
        {
            _browserSteps.GivenInTheUsersBrowser(user);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(PrivateCallPopupPage.CallRejectedMessage).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser].Click(PrivateCallPopupPage.CallRejectedCloseButton);
        }

        [Then(@"the private consultation link with (.*) is not visible")]
        public void ThenThePrivateConsultationLinkIsNotVisible(string text)
        {
            _browsers[_c.CurrentUser].Refresh();
            Thread.Sleep(TimeSpan.FromSeconds(SecondsWaitForTheLinkToAppear));
            var user = Users.GetUserFromText(text, _c.Test.Users);
            var participantId = _c.Test.ConferenceParticipants.First(x => x.Username.ToLower().Contains(user.Username.ToLower())).Id;
            _browsers[_c.CurrentUser].Driver.WaitUntilElementNotVisible(ParticipantListPanel.PrivateConsultationLink(participantId)).Should().BeTrue();
        }

        [Then(@"the (.*) user sees a message that the request has not been answered")]
        public void ThenTheRepresentativeUserSeesAMessageThatTheRequestHasNotBeenAnswered(string user)
        {
            _browserSteps.GivenInTheUsersBrowser(user);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(PrivateCallPopupPage.CallRejectedMessage).Displayed.Should().BeTrue();
        }

        [Then(@"the (.*) and (?:the|their) (.*) can both leave the private consultation room")]
        public void ThenTheUsersCanBothLeaveThePrivateConsultationRoom(string user1, string user2)
        {
            WhenTheUserLeavesThePrivateConsultationRoom(user1);
            WhenTheUserLeavesThePrivateConsultationRoom(user2);
        }

        [Then(@"the continue button will be disabled")]
        public void ThenTheContinueButtonWillBeDisabled()
        {
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(WaitingRoomPage.ContinueButton).Enabled.Should().BeFalse();
        }

        [Then(@"no other participants can be invited to join a private consultation")]
        public void ThenParticipantsNotConnectedCantBeInvited()
        {
            _browsers[_c.CurrentUser].Driver.FindElements(WaitingRoomPage.EnabledParticipants).Should().BeEmpty();
        }

        [Then(@"the (.*) will see (?:the|their) (.*) declined the invitation")]
        public void ThenTheUserWillSeeAnotherUserDeclinedTheCall(string user1, string user2)
        {
            _browserSteps.GivenInTheUsersBrowser(user1);
            var otherUser = Users.GetUserFromText(user2, _c.Test.Users);
            _browsers[_c.CurrentUser].Driver
                .WaitUntilVisible(PrivateConsultationRoomPage.StatusOfUser(otherUser.Display_name)).Text.Should().Be("Declined");
        }

        [Then(@"the (.*) will not be able to join the meeting room containing the (.*)")]
        public void TheTheUserWillNotBeAbleToJoinOtherUsersRoom(string user1, string user2)
        {
            var user2MeetingRoom = TheMeetingRoomUserIsIn(user2);
            _browserSteps.GivenInTheUsersBrowser(user1);
            _browsers[_c.CurrentUser].Click(WaitingRoomPage.JoinPrivateMeetingButton);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(WaitingRoomPage.ContinueButton);
            _browsers[_c.CurrentUser].Driver.FindElement(WaitingRoomPage.MeetingRoomRadioButtonFor(user2MeetingRoom)).Enabled.Should().BeFalse();
            _browsers[_c.CurrentUser].Driver.FindElement(WaitingRoomPage.ContinueButton).Enabled.Should().BeFalse();
        }
        private string TheMeetingRoomUserIsIn(string user)
        {
            _browserSteps.GivenInTheUsersBrowser(user);
            return _browsers[_c.CurrentUser].Driver.FindElement(PrivateConsultationRoomPage.RoomTitle).Text;
        }

        private List<string> TheUsersListedInTheMeetingRoomSeenBy(string user)
        {
            _browserSteps.GivenInTheUsersBrowser(user);
            var elements = _browsers[_c.CurrentUser].Driver
                .FindElements(PrivateConsultationRoomPage.ParticipantsInRoom);
            return elements.Select(element => element.Text).ToList();
        }
        
        private void WaitForUserToBeInState(string username, params ParticipantState [] participantStates)
        {
            new PollForParticipantStatus(_c.Apis.TestApi)
                .WithConferenceId(_c.Test.NewConferenceId)
                .WithParticipant(username)
                .WithExpectedState(participantStates)
                .Retries(MaxRetries)
                .Poll();
        }
    }
}
