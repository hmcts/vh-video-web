using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using AcceptanceTests.Common.Driver.Browser;
using AcceptanceTests.Common.Driver.Helpers;
using FluentAssertions;
using TechTalk.SpecFlow;
using VideoWeb.AcceptanceTests.Assertions;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.AcceptanceTests.Pages;
using VideoWeb.Services.Video;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public class InstantMessagingSteps
    {
        private const int Timeout = 60;
        private readonly Dictionary<string, UserBrowser> _browsers;
        private readonly TestContext _c;
        private readonly BrowserSteps _browserSteps;
        private readonly List<ChatMessage> _messages;

        public InstantMessagingSteps(Dictionary<string, UserBrowser> browsers, TestContext c, BrowserSteps browserSteps)
        {
            _browsers = browsers;
            _c = c;
            _browserSteps = browserSteps;
            _messages = new List<ChatMessage>();
        }

        [Given(@"the VHO selects the Hearings tab")]
        public void GivenTheVideoHearingsOfficerSelectsTheHearingsTab()
        {
            SelectTheHearing();
            SelectTheHearingsTab();
        }

        [Given(@"the VHO selects the Messages tab")]
        public void GivenTheVideoHearingsOfficerSelectsTheMessagesTab()
        {
            SelectTheHearing();
            SelectTheMessagesTab();
        }

        [When(@"the Video Hearings Officer instant messages the Clerk")]
        public void TheVhoInstantMessagesTheClerk()
        {
            _browserSteps.GivenInTheUsersBrowser("Video Hearings Officer");
            SelectTheHearing();
            SelectTheMessagesTab();
            SelectTheParticipant();
            SendNewMessage();
        }

        [When(@"the Clerk instant messages the Video Hearings Officer")]
        public void TheClerkInstantMessagesTheVideoHearingsOfficer()
        {
            _browserSteps.GivenInTheUsersBrowser("Clerk");
            SendNewMessage();
        }

        [When(@"the Clerk opens the chat window")]
        public void OpenChatWindow()
        {
            _browserSteps.GivenInTheUsersBrowser("Clerk");
            _browsers[_c.CurrentUser.Key].Click(InstantMessagePage.OpenChat);
        }

        [When(@"the Clerk closes the chat window")]
        public void WhenTheClerkClosesTheChatWindow()
        {
            _browserSteps.GivenInTheUsersBrowser("Clerk");
            _browsers[_c.CurrentUser.Key].Click(InstantMessagePage.CloseChat);
        }

        [Then(@"the Clerk can no longer see the messages")]
        public void ThenTheClerkCanNoLongerSeeTheMessages()
        {
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilElementNotVisible(InstantMessagePage.SendNewMessageButton).Should().BeTrue();
        }

        [Then(@"the (.*) can see the message")]
        public void ThenTheUserCanSeeTheMessage(string user)
        {
            _browserSteps.GivenInTheUsersBrowser(user);
            var chatMessages = new GetChatMessages(_browsers[_c.CurrentUser.Key]).WaitFor(_messages.Count).Fetch();
            chatMessages.Count.Should().BePositive();
            AssertChatMessage.Assert(_messages.Last(), chatMessages.Last(), _c.TimeZone);
        }

        [Then(@"the Clerk can see the notification for the message")]
        public void ThenTheClerkCanSeeTheNotificationForTheMessage()
        {
            _browserSteps.GivenInTheUsersBrowser("Clerk");
            var newMessagesCount = _browsers[_c.CurrentUser.Key].Driver.WaitUntilElementExists(InstantMessagePage.UnreadMessagesBadge).GetAttribute("data-badge");
            int.Parse(newMessagesCount).Should().BePositive();
        }

        [When(@"the Video Hearings Officer navigates to the message")]
        public void ThenTheVideoHearingsOfficerNavigatesToTheMessage()
        {
            _browserSteps.GivenInTheUsersBrowser("Video Hearings Officer");
            SelectTheHearing();
            SelectTheMessagesTab();
            SelectTheParticipant();
        }

        [When(@"the participants send (.*) messages to each other")]
        public void WhenTheParticipantsSendMultipleMessagesToEachOther(int numberOfMessagesAndReplies)
        {
            for (var i = 0; i < numberOfMessagesAndReplies; i++)
            {
                TheVhoInstantMessagesTheClerk();
                TheClerkInstantMessagesTheVideoHearingsOfficer();
            }
        }

        [Then(@"they can see all the messages")]
        public void ThenTheyCanSeeAllTheMessages()
        {
            CheckMessagesAreAllDisplayed("Clerk");
            CheckMessagesAreAllDisplayed("Video Hearings Officer");
        }

        private void SelectTheHearing()
        {
            _browsers[_c.CurrentUser.Key].Click(VhoHearingListPage.SelectHearingButton(_c.Test.Conference.Id));
        }

        private void SelectTheHearingsTab()
        {
            _browsers[_c.CurrentUser.Key].Click(VhoHearingListPage.HearingsTabButton);
        }

        private void SelectTheMessagesTab()
        {
            _browsers[_c.CurrentUser.Key].Click(VhoHearingListPage.MessagesTabButton);
        }

        private void SelectTheParticipant()
        {
            var judgeParticipantId = _c.Test.Conference.Participants.First(x => x.User_role == UserRole.Judge).Id;
            _browsers[_c.CurrentUser.Key].Click(VhoHearingListPage.SelectParticipantToMessage(judgeParticipantId));
        }

        private void SendNewMessage()
        {
            var sender = _c.CurrentUser.Role.ToLower().Equals("clerk")? _c.CurrentUser.DisplayName : _c.CurrentUser.Firstname;
            _messages.Add(new ChatMessage()
            {
                Message = Faker.Company.BS(),
                Sender = sender,
                Time = _c.TimeZone.Adjust(DateTime.Now).ToShortTimeString()
            });
            _browsers[_c.CurrentUser.Key].Click(InstantMessagePage.SendNewMessageTextBox);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(InstantMessagePage.SendNewMessageTextBox).SendKeys(_messages.Last().Message);
            _browsers[_c.CurrentUser.Key].Click(InstantMessagePage.SendNewMessageButton);
        }

        private void CheckMessagesAreAllDisplayed(string user)
        {
            _browserSteps.GivenInTheUsersBrowser(user);
            var chatMessages = new GetChatMessages(_browsers[_c.CurrentUser.Key]).WaitFor(_messages.Count).Fetch();
            chatMessages.Count.Should().Be(_messages.Count);
            AssertChatMessage.AssertAll(_messages, chatMessages);
        }
    }
}
