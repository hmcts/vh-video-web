using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using AcceptanceTests.Common.Driver.Browser;
using AcceptanceTests.Common.Driver.Helpers;
using FluentAssertions;
using TechTalk.SpecFlow;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.AcceptanceTests.Pages;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public class InstantMessagingSteps
    {
        private const int Timeout = 30;
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

        [When(@"the Video Hearings Officer instant messages the Clerk")]
        public void WhenTheVhoInstantMessagesTheClerk()
        {
            _browserSteps.GivenInTheUsersBrowser("Video Hearings Officer");
            _browsers[_c.CurrentUser.Key].Click(VhoHearingListPage.VideoHearingsOfficerSelectHearingButton(_c.Test.Conference.Id));
            SendNewMessage();
        }

        [When(@"the Clerk instant messages the Video Hearings Officer")]
        public void WhenTheClerkInstantMessagesTheVideoHearingsOfficer()
        {
            _browserSteps.GivenInTheUsersBrowser("Clerk");
            SendNewMessage();
        }

        [When(@"the Clerk opens the chat window")]
        public void OpenChatWindow()
        {
            _browsers[_c.CurrentUser.Key].Click(InstantMessagePage.OpenChat);
        }

        [When(@"the Video Hearings Officer attempts to send an instant messages to the clerk who is not in the waiting room")]
        public void WhenTheVhoInstantMessagesTheClerkWhoIsNotInTheWaitingRoom()
        {
            ScenarioContext.Current.Pending();
        }

        [When(@"the Clerk closes the chat window")]
        public void WhenTheClerkCloseTheChatWindow()
        {
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
            var chatMessages = new GetChatMessages(_browsers[_c.CurrentUser.Key]).Fetch();
            chatMessages.Count.Should().BePositive();
            chatMessages.Last().Should().BeEquivalentTo(_messages.Last());
        }

        [Then(@"the Clerk can see the notification for the message")]
        public void ThenTheClerkCanSeeTheNotificationForTheMessage()
        {
            _browserSteps.GivenInTheUsersBrowser("Clerk");
            var newMessagesCount = _browsers[_c.CurrentUser.Key].Driver.WaitUntilElementExists(InstantMessagePage.UnreadMessagesBadge).GetAttribute("data-badge");
            int.Parse(newMessagesCount).Should().BePositive();
        }

        [Then(@"the Video Hearings Officer can see the notification for the message")]
        public void ThenTheVideoHearingsOfficerCanSeeTheNotificationForTheMessage()
        {
            _browserSteps.GivenInTheUsersBrowser("Video Hearings Officer");
            NotificationAppears(1).Should().BeTrue();
        }

        private void SendNewMessage()
        {
            _messages.Add(new ChatMessage()
            {
                Message = $"{_c.CurrentUser.Lastname} is sending a message {Guid.NewGuid()}",
                Sender = _c.CurrentUser.Firstname,
                Time = DateTime.Now.ToLocalTime().ToShortTimeString()
            });
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(InstantMessagePage.SendNewMessageTextBox).SendKeys(_messages.Last().Message);
            _browsers[_c.CurrentUser.Key].Click(InstantMessagePage.SendNewMessageButton);
        }

        private bool NotificationAppears(int expected)
        {
            for (var i = 0; i < Timeout; i++)
            {
                var newMessagesCount = _browsers[_c.CurrentUser.Key].Driver.WaitUntilElementExists(VhoHearingListPage.UnreadMessagesBadge(_c.Test.NewConferenceId)).Text.Trim();
                if (int.Parse(newMessagesCount).Equals(expected))
                {
                    return true;
                }
                Thread.Sleep(TimeSpan.FromSeconds(1));
            }
            return false;
        }
    }
}
