using System;
using System.Collections.Generic;
using System.Linq;
using AcceptanceTests.Common.Driver.Drivers;
using AcceptanceTests.Common.Driver.Helpers;
using FluentAssertions;
using TechTalk.SpecFlow;
using VideoWeb.AcceptanceTests.Assertions;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.AcceptanceTests.Pages;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public class InstantMessagingSteps
    {
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

        [When(@"the Video Hearings Officer instant messages the (.*) user")]
        public void TheVhoInstantMessagesTheUser(string user)
        {
            _browserSteps.GivenInTheUsersBrowser("Video Hearings Officer");
            SelectTheHearing();
            SelectTheMessagesTab();
            SelectTheUser(user);
            SendNewMessage();
        }

        [When(@"the (.*) user instant messages the Video Hearings Officer")]
        public void TheUserInstantMessagesTheVideoHearingsOfficer(string user)
        {
            _browserSteps.GivenInTheUsersBrowser(user);
            SendNewMessage();
        }

        [When(@"the (.*) user opens the chat window")]
        public void OpenChatWindow(string user)
        {
            _browserSteps.GivenInTheUsersBrowser(user);
            _browsers[_c.CurrentUser.Key].Click(InstantMessagePage.OpenChat);
        }

        [When(@"the (.*) user closes the chat window")]
        public void WhenTheUserClosesTheChatWindow(string user)
        {
            _browserSteps.GivenInTheUsersBrowser(user);
            _browsers[_c.CurrentUser.Key].Click(InstantMessagePage.CloseChat);
        }

        [Then(@"the user can no longer see the messages")]
        public void ThenTheUserCanNoLongerSeeTheMessages()
        {
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilElementNotVisible(InstantMessagePage.SendNewMessageButton).Should().BeTrue();
        }

        [Then(@"the (.*) user can see the message")]
        public void ThenTheUserCanSeeTheMessage(string user)
        {
            _browserSteps.GivenInTheUsersBrowser(user);
            var chatMessages = new GetChatMessages(_browsers[_c.CurrentUser.Key]).WaitFor(_messages.Count).Fetch();
            chatMessages.Count.Should().BePositive();
            AssertChatMessage.Assert(_messages.Last(), chatMessages.Last(), _c.TimeZone);
        }

        [Then(@"the (.*) user can see the notification for the message")]
        public void ThenTheUserCanSeeTheNotificationForTheMessage(string user)
        {
            _browserSteps.GivenInTheUsersBrowser(user);
            var newMessagesCount = _browsers[_c.CurrentUser.Key].Driver.WaitUntilElementExists(InstantMessagePage.UnreadMessagesBadge).GetAttribute("data-badge");
            int.Parse(newMessagesCount).Should().BePositive();
        }

        [When(@"the Video Hearings Officer navigates to the message from the (.*) user")]
        public void ThenTheVideoHearingsOfficerNavigatesToTheMessage(string user)
        {
            _browserSteps.GivenInTheUsersBrowser("Video Hearings Officer");
            SelectTheHearing();
            SelectTheMessagesTab();
            SelectTheUser(user);
        }

        [When(@"the VHO and (.*) send (.*) messages to each other")]
        public void WhenTheParticipantsSendMultipleMessagesToEachOther(string user, int numberOfMessagesAndReplies)
        {
            for (var i = 0; i < numberOfMessagesAndReplies; i++)
            {
                TheVhoInstantMessagesTheUser(user);
                TheUserInstantMessagesTheVideoHearingsOfficer(user);
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

        private void SelectTheUser(string user)
        {
            var participantId = _c.Test.Conference.Participants.First(x => x.Display_name.ToLower().Contains(user.ToLower())).Id;
            _browsers[_c.CurrentUser.Key].Click(VhoHearingListPage.SelectParticipantToMessage(participantId));
        }

        private void SendNewMessage()
        {
            var sender = GetSenderNameFormat();
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

        private string GetSenderNameFormat()
        {
            return _c.CurrentUser.Role.ToLower().Equals("video hearings officer") ? _c.CurrentUser.Firstname : _c.CurrentUser.DisplayName;
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
