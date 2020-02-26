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
            SelectTheHearing();
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
            SelectTheHearing();
            NotificationAppears(1).Should().BeTrue();
        }

        private void SelectTheHearing()
        {
            _browsers[_c.CurrentUser.Key].Click(VhoHearingListPage.VideoHearingsOfficerSelectHearingButton(_c.Test.Conference.Id));
        }

        private void SendNewMessage()
        {
            var sender = _c.CurrentUser.Role.ToLower().Equals("clerk")? _c.CurrentUser.DisplayName : _c.CurrentUser.Firstname;
            _messages.Add(new ChatMessage()
            {
                Message = Faker.Company.BS(),
                Sender = sender,
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
