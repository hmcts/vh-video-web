using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using AcceptanceTests.Common.Data.Helpers;
using AcceptanceTests.Common.Driver.Drivers;
using AcceptanceTests.Common.Driver.Helpers;
using AcceptanceTests.Common.Test.Helpers;
using FluentAssertions;
using OpenQA.Selenium;
using TechTalk.SpecFlow;
using VideoWeb.AcceptanceTests.Data;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.AcceptanceTests.Pages;
using TestApi.Contract.Dtos;
using VideoApi.Contract.Enums;
using VideoApi.Contract.Responses;
using FluentAssertions.Execution;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public sealed class WaitingRoomSteps : ISteps
    {
        private const int ExtraTimeAfterReachingWaitingRoom = 3;
        private const int ExtraTimeInWaitingRoomAfterThePause = 10;
        private readonly Dictionary<UserDto, UserBrowser> _browsers;
        private readonly TestContext _c;
        private readonly BrowserSteps _browserSteps;

        public WaitingRoomSteps(Dictionary<UserDto, UserBrowser> browsers, TestContext testContext,
            BrowserSteps browserSteps)
        {
            _browsers = browsers;
            _c = testContext;
            _browserSteps = browserSteps;
        }

        [When(@"the user navigates back to the hearing list")]
        public void WhenTheUserNavigatesBackToTheHearingList()
        {
            _browsers[_c.CurrentUser].Click(JudgeWaitingRoomPage.ReturnToHearingRoomLink);
        }

        [When(@"the Judge resumes the hearing")]
        public void ThenTheUserResumesTheHearing()
        {
            Thread.Sleep(TimeSpan.FromSeconds(ExtraTimeInWaitingRoomAfterThePause));
            _browsers[_c.CurrentUser].Click(JudgeWaitingRoomPage.ResumeVideoCallButton);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(JudgeWaitingRoomPage.ConfirmStartHearingButton).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser].Click(JudgeWaitingRoomPage.ConfirmStartHearingButton);
        }

        [When(@"the judge opens the change camera and microphone popup")]
        public void WhenTheJudgeOpensTheChangeCameraAndMicrophonePopup()
        {
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(JudgeWaitingRoomPage.ChooseCameraMicrophoneButton).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser].Click(JudgeWaitingRoomPage.ChooseCameraMicrophoneButton);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(JudgeWaitingRoomPage.CloseChangeDeviceButton);
        }

        [When(@"the judge dismisses the change camera popup")]
        [Then(@"the judge dismisses the change camera popup")]
        public void TheJudgeDismissesTheChangeCameraPopup()
        {
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(JudgeWaitingRoomPage.CloseChangeDeviceButton).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser].Click(JudgeWaitingRoomPage.CloseChangeDeviceButton);
            _browsers[_c.CurrentUser].Driver.WaitUntilElementNotVisible(JudgeWaitingRoomPage.CloseChangeDeviceButton);
        }

        [Then(@"the participant status for (.*) is displayed as (.*)")]
        public void ThenTheParticipantStatusOfUserIsDisplayed(string name, string status)
        {
            var user = Users.GetUserFromText(name, _c.Test.Users);
            var participant = _c.Test.ConferenceParticipants.Single(x => x.Username.ToLower().Equals(user.Username.ToLower()));
            _browsers[_c.CurrentUser].TextOf(JudgeParticipantPanel.ParticipantStatus(participant.Id)).ToUpper().Should().Be(status.ToUpper());
        }

        [Then(@"the (.*) will see the status for (.*) is displayed as (.*)")]
        public void ThenTheUserWillSeeOtherParticipantsStatus(string user, string name, string status)
        {
            _browserSteps.GivenInTheUsersBrowser(user);
            ThenTheParticipantStatusOfUserIsDisplayed(name, status);
        }

        [Then(@"the Judge can see information about their case")]
        [Then(@"the Judge can see information about their case")]
        public void ThenTheJudgeCanSeeInformationAboutTheirCase()
        {
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(JudgeWaitingRoomPage.ReturnToHearingRoomLink).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(JudgeWaitingRoomPage.ContactVho).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser].TextOf(JudgeWaitingRoomPage.HearingTitle).Should().Be($"{_c.Test.Case.Name} ({_c.Test.Hearing.CaseTypeName}) case number: {_c.Test.Hearing.Cases.First().Number}");
            
            var startDate = _c.TimeZone.Adjust(_c.Test.Hearing.ScheduledDateTime);
            var dateAndStartTime = startDate.ToString(DateFormats.JudgeWaitingRoomPageTime);
            var endTime = startDate.AddMinutes(_c.Test.Hearing.ScheduledDuration).ToString(DateFormats.JudgeWaitingRoomPageTimeEnd);
            var displayedTime = TextHelpers.RemoveSpacesOnSafari(_browsers[_c.CurrentUser].TextOf(JudgeWaitingRoomPage.HearingDateTime));
            displayedTime.Should().Be($"{dateAndStartTime} to {endTime}");
            
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(JudgeWaitingRoomPage.StartHearingText).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(JudgeWaitingRoomPage.IsEveryoneConnectedText).Displayed.Should().BeTrue();
        }

        [Then(@"the participant can see information about their case")]
        public void ThenTheUserCanSeeInformationAboutTheirCase()
        {
            _browsers[_c.CurrentUser].TextOf(WaitingRoomPage.HearingCaseDetails).Should().Contain(_c.Test.Case.Name);
            _browsers[_c.CurrentUser].TextOf(WaitingRoomPage.HearingCaseDetails).Should().Contain($"case number: {_c.Test.Hearing.Cases.First().Number}");
            
            var displayedDateTime = TextHelpers.RemoveSpacesOnSafari(_browsers[_c.CurrentUser].TextOf(WaitingRoomPage.HearingDate));
            displayedDateTime.Should().Contain(_c.TimeZone.Adjust(_c.Test.Hearing.ScheduledDateTime).ToString(DateFormats.WaitingRoomPageDate));
            displayedDateTime.Should().Contain(_c.TimeZone.Adjust(_c.Test.Hearing.ScheduledDateTime).ToString(DateFormats.WaitingRoomPageTime));
            
            var endTime = _c.TimeZone.Adjust(_c.Test.Hearing.ScheduledDateTime).AddMinutes(_c.Test.Hearing.ScheduledDuration).ToString(DateFormats.WaitingRoomPageTime);
            displayedDateTime.Should().Contain(endTime);
            
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(WaitingRoomPage.ContactVhTeam).Displayed.Should().BeTrue();
        }

        [Then(@"the (.*) can see a list of participants and their representatives")]
        public void ThenTheUserCanSeeAListOfParticipantsAndTheirRepresentatives(string user)
        {
            var panelMembers = _c.Test.ConferenceParticipants.FindAll(x => x.LastName.ToLower().Contains("panelmember"));
            var individuals = _c.Test.ConferenceParticipants.FindAll(x => x.LastName.ToLower().Contains("individual"));
            var representatives = _c.Test.ConferenceParticipants.FindAll(x => x.LastName.ToLower().Contains("representative"));
            var observers = _c.Test.ConferenceParticipants.FindAll(x => x.LastName.ToLower().Contains("observer"));
            var interpreters = _c.Test.ConferenceParticipants.FindAll(x => x.LastName.ToLower().Contains("interpreter"));

            (panelMembers.Count + individuals.Count + interpreters.Count + representatives.Count + observers.Count).Should().BeGreaterThan(0);

            foreach (var panelMember in panelMembers)
            {
                _browsers[_c.CurrentUser].TextOf(GetPanelMemberName(user, panelMember.Id)).Should().Be(panelMember.Name);
            }

            foreach (var individual in individuals)
            {
                _browsers[_c.CurrentUser].TextOf(GetParticipantName(user, individual.Id)).Should().Be(individual.Name);
                _browsers[_c.CurrentUser].TextOf(GetParticipantHearingRole(user, individual.Id)).Should().Be(individual.HearingRole);
                if (!individual.CaseTypeGroup.ToLower().Equals("none"))
                {
                    _browsers[_c.CurrentUser].TextOf(GetParticipantCaseType(user, individual.Id)).Should().Be(individual.CaseTypeGroup);
                }
            }
            
            foreach (var interpreter in interpreters)
            {
                var interpretee = _c.Test.ConferenceParticipants.Single(p => p.Id == interpreter.LinkedParticipants.Single().LinkedId);
                VerifyInterpreterOrRepresentative(user, interpreter, interpretee.Name, false);                
            }

            foreach (var representative in representatives)
            { 
                VerifyInterpreterOrRepresentative(user, representative, representative.Representee);
            }

            foreach (var observer in observers)
            {
                _browsers[_c.CurrentUser].TextOf(GetObserverName(user, observer.Id)).Should().Be(observer.Name);
            }
        }

        private void VerifyInterpreterOrRepresentative(string user, ParticipantDetailsResponse participant, string forUserName, bool representative = true)
        {
            _browsers[_c.CurrentUser].TextOf(GetParticipantName(user, participant.Id)).Should().Be(participant.Name);
            var invalidCaseType = participant.CaseTypeGroup.ToLower().Equals("none");

            if (invalidCaseType && representative) 
                return;

            if (!invalidCaseType)
                _browsers[_c.CurrentUser].TextOf(GetParticipantCaseType(user, participant.Id)).Should().Be(participant.CaseTypeGroup);

            ShouldInterpretOrRepresentFor(user, participant, forUserName);
        }

        private void ShouldInterpretOrRepresentFor(string user, ParticipantDetailsResponse participant, string forUserName)
        {
            var representOrInterpretFor = _browsers[_c.CurrentUser].TextOf(GetParticipantHearingRole(user, participant.Id));
            representOrInterpretFor.Should().Contain($"{participant.HearingRole} for");
            representOrInterpretFor.Should().Contain($"{forUserName}");
        }
        
        [Then(@"the (.*) below their own entry in the participant list")]
        public void ThenTheUserBelowTheirOwnEntryInTheParticipantList(string user)
        {
            var interpretee = _c.Test.ConferenceParticipants.Single(x => 
                x.UserRole==UserRole.Individual && x.HearingRole != "Interpreter" && x.LinkedParticipants.Any());
            var interpreter = _c.Test.ConferenceParticipants.Single(x =>
                x.UserRole == UserRole.Individual && x.HearingRole == "Interpreter" && x.LinkedParticipants.Any());

            var participantText = _browsers[_c.CurrentUser].TextOf(GetParticipantWithInterpreter(user, interpretee.Id));
            participantText.Should().Contain(interpreter.HearingRole);
            participantText.Should().Contain(interpretee.Name);
        }
        
        private static By GetParticipantWithInterpreter(string user, Guid interpreteeId)
        {
            return user == "Participant" 
                ? ParticipantListPanel.ParticipantWithInterpreter(interpreteeId) 
                : JudgeParticipantPanel.ParticipantWithInterpreter(interpreteeId);
        }

        private static By GetPanelMemberName(string user,Guid id)
        {
            return user == "Participant" ? ParticipantListPanel.PanelMemberName(id): JudgeParticipantPanel.PanelMemberName(id);           
        }

        private static By GetParticipantName(string user, Guid id)
        {
            return user == "Participant" ? ParticipantListPanel.ParticipantName(id) : JudgeParticipantPanel.ParticipantName(id);
        }

        private static By GetParticipantHearingRole(string user, Guid id)
        {
            return user == "Participant" ? ParticipantListPanel.ParticipantHearingRole(id) : JudgeParticipantPanel.ParticipantHearingRole(id);
        }

        private static By GetParticipantCaseType(string user, Guid id)
        {
            return user == "Participant" ? ParticipantListPanel.ParticipantCaseTypeGroup(id) : JudgeParticipantPanel.ParticipantCaseType(id);
        }

        private static By GetObserverName(string user, Guid id)
        {
            return user == "Participant" ? ParticipantListPanel.ObserverName(id) : JudgeParticipantPanel.ObserverName(id);
        }

        [Then(@"the Judge can see other participants status")]
        [Then(@"(?:he|she|they) can see other participants status")]
        public void ThenTheUserCanSeeOtherParticipantsStatus()
        {
            var participants = _c.Test.ConferenceParticipants.Where(participant =>
                participant.UserRole == UserRole.Individual ||
                participant.UserRole == UserRole.Representative);
            foreach (var participant in participants)
            {
                _browsers[_c.CurrentUser].TextOf(JudgeParticipantPanel.ParticipantStatus(participant.Id)).ToUpperInvariant().Should()
                    .BeEquivalentTo("Not signed in".ToUpperInvariant());
            }
        }

        [Then(@"the user can see the hearing is (.*) title")]
        public void ThenTheUserCanSeeTheHearingIsAAboutToBeginTitle(string title)
        {
            var headerElement = title.Equals("delayed") ? WaitingRoomPage.DelayedHeader : WaitingRoomPage.ScheduledHeader;
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(headerElement).Displayed.Should().BeTrue();
        }

        private string GetTheTimePanelColour()
        {
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(WaitingRoomPage.TimePanel);
            _browsers[_c.CurrentUser].ScrollTo(WaitingRoomPage.TimePanel);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(WaitingRoomPage.TimePanel).Displayed.Should().BeTrue();
            var rgba = _browsers[_c.CurrentUser].Driver.WaitUntilElementExists(WaitingRoomPage.TimePanel).GetCssValue("background-color");
            return CustomConverters.ConvertRgbToHex(rgba);
        }

        [Then(@"the user can see a yellow box and a delayed message")]
        public void ThenTheUserCanSeeAYellowBox()
        {
            var actualColour = GetTheTimePanelColour();
            actualColour.Should().Be(WaitingRoomPage.DelayedBgColour);
            _browsers[_c.CurrentUser].Driver.WaitUntilElementExists(WaitingRoomPage.DelayedText).Displayed.Should().BeTrue();
        }

        [Then(@"the user can see a blue box and a scheduled message")]
        public void ThenTheUserCanSeeABlueBox()
        {
            var actualColour = GetTheTimePanelColour();
            actualColour.Should().Be(WaitingRoomPage.ScheduledBgColour);
            _browsers[_c.CurrentUser].Driver.WaitUntilElementExists(WaitingRoomPage.ScheduledText).Displayed.Should().BeTrue();
        }

        [Then(@"the user can see a black box and an about to begin message")]
        public void ThenTheUserCanSeeABlackBox()
        {
            var actualColour = GetTheTimePanelColour();
            actualColour.Should().Be(WaitingRoomPage.AboutToBeginBgColour);
            _browsers[_c.CurrentUser].Driver.WaitUntilElementExists(WaitingRoomPage.AboutToBeginText).Displayed.Should().BeTrue();
        }

        [Then(@"the Judge waiting room displays the paused status")]
        public void ThenTheJudgeWaitingRoomDisplaysThePausedStatus()
        {
            _browsers[_c.CurrentUser].Driver.SwitchTo().DefaultContent();
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(JudgeWaitingRoomPage.PausedText).Displayed.Should().BeTrue();
        }

        [Then(@"the participants waiting room displays the paused status")]
        public void ThenTheWaitingRoomDisplaysThePausedStatus()
        {
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(WaitingRoomPage.PausedTitle).Displayed.Should().BeTrue();
        }

        [Then(@"the participants waiting room displays the closed status")]
        public void ThenTheWaitingRoomDisplaysTheClosedStatus()
        {
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(WaitingRoomPage.ClosedTitle).Displayed.Should().BeTrue();
        }

        [When(@"the waiting room page has loaded for the (.*)")]
        public void WhenTheWaitingRoomPageHasLoadedForTheUser(string user)
        {
            if (user.ToLower().Equals("judge"))
            {
                ThenTheJudgeCanSeeInformationAboutTheirCase();
            }
            else
            {
                ThenTheUserCanSeeInformationAboutTheirCase();
            }
        }

        [When(@"the Judge starts the hearing")]
        public void ProgressToNextPage()
        {
            Thread.Sleep(TimeSpan.FromSeconds(ExtraTimeAfterReachingWaitingRoom));
            _browsers[_c.CurrentUser].Driver.WaitUntilElementNotVisible(JudgeWaitingRoomPage.PleaseWaitText);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(JudgeWaitingRoomPage.StartVideoHearingButton).Displayed.Should().BeTrue();
            CheckParticipantsAreStillConnected();
            _browsers[_c.CurrentUser].Click(JudgeWaitingRoomPage.StartVideoHearingButton);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(JudgeWaitingRoomPage.ConfirmStartHearingButton).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser].Click(JudgeWaitingRoomPage.ConfirmStartHearingButton);
        }

        [Then(@"the number of people in the consultation room is (.*)")]
        public void TheNumberOfPeopleInTheConsultationRoom(int numberOfPeople)
        {
            int.Parse(_browsers[_c.CurrentUser].TextOf(JudgeWaitingRoomPage.NumberOfJohsInConsultaionRoom)).Should().Be(numberOfPeople);
        }

        
        [Then(@"the judge waiting room displays consultation room is available")]
        public void ThenTheJudgeWaitingRoomDisplaysConsultationRoomIsAvailable()
        {
            var closeTime = _c.TimeZone.Adjust(_c.Test.HearingClosedTime.AddMinutes(_c.VideoWebConfig.consultationRoomTimeout)).ToString(DateFormats.WaitingRoomPageTime);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(WaitingRoomPage.ConsultationRoomText).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(WaitingRoomPage.ConsultationRoomCloseText(closeTime)).Displayed.Should().BeTrue();
        }

        private void CheckParticipantsAreStillConnected()
        {
            var loggedInParticipants = LoggedInParticipants(_browsers.Keys, _c.Test.ConferenceParticipants);
            var participantDetailsResponses = loggedInParticipants as ParticipantDetailsResponse[] ?? loggedInParticipants.ToArray();
            foreach (var user in participantDetailsResponses)
            {
                NUnit.Framework.TestContext.WriteLine($"Checking the status of {user.DisplayName} - {_browsers[_c.CurrentUser].TextOf(JudgeParticipantPanel.ParticipantStatus(user.Id))}");
                if ((user.UserRole == UserRole.Judge)) continue;
                _browsers[_c.CurrentUser].Driver.WaitUntilVisible(JudgeParticipantPanel.ParticipantStatus(user.Id));
                _browsers[_c.CurrentUser].ScrollTo(JudgeParticipantPanel.ParticipantStatus(user.Id));
                _browsers[_c.CurrentUser].TextOf(JudgeParticipantPanel.ParticipantStatus(user.Id)).ToUpper()
                    .Should().BeOneOf("CONNECTED", "IN CONSULTATION");
                if (user.HearingRole.ToLower() != "interpreter") continue;
                var interpretee = participantDetailsResponses.Single(p => p.Id == user.LinkedParticipants.Single().LinkedId);
                ShouldInterpretOrRepresentFor("Participant", user, interpretee.Name);
            }
        }

        private static IEnumerable<ParticipantDetailsResponse> LoggedInParticipants(Dictionary<UserDto, UserBrowser>.KeyCollection browsersKeys, IReadOnlyCollection<ParticipantDetailsResponse> allParticipants)
        {
            var participants = (from user in browsersKeys where allParticipants.Any(x => x.Name.ToLower().Contains(user.LastName.ToLower())) select allParticipants.First(x => x.Name.ToLower().Contains(user.LastName.ToLower()))).ToList();
            participants.Should().NotBeNullOrEmpty();
            return participants;
        }
    }
}
