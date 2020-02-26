using System;
using System.Collections.Generic;
using System.Text.RegularExpressions;
using TechTalk.SpecFlow;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.AcceptanceTests.Journeys;
using VideoWeb.AcceptanceTests.Pages;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public class ProgressionSteps
    {
        private readonly TestContext _c;
        private readonly DataSetupSteps _dataSetupSteps;
        private readonly BrowserSteps _browserSteps;
        private readonly LoginSteps _loginSteps;
        private readonly HearingsListSteps _hearingListSteps;
        private readonly VhoHearingListSteps _vhoHearingListSteps;
        private readonly IntroductionSteps _introductionSteps;
        private readonly EquipmentCheckSteps _equipmentCheckSteps;
        private readonly SwitchOnCamAndMicSteps _switchOnCamAndMicSteps;
        private readonly PracticeVideoHearingSteps _practiceVideoHearingSteps;
        private readonly EquipmentWorkingSteps _equipmentWorkingSteps;
        private readonly RulesSteps _rulesSteps;
        private readonly DeclarationSteps _declarationSteps;
        private readonly WaitingRoomSteps _waitingRoomSteps;
        private readonly HearingRoomSteps _hearingRoomSteps;

        public ProgressionSteps(
            TestContext testContext, 
            DataSetupSteps dataSetupSteps,
            LoginSteps loginSteps, 
            HearingsListSteps hearingListSteps, 
            VhoHearingListSteps vhoHearingListSteps,
            IntroductionSteps introductionSteps,
            EquipmentCheckSteps equipmentCheckSteps, 
            SwitchOnCamAndMicSteps switchOnCamAndMicSteps,
            HearingRoomSteps hearingRoomSteps, 
            PracticeVideoHearingSteps practiceVideoHearingSteps,
            EquipmentWorkingSteps equipmentWorkingSteps, 
            RulesSteps rulesSteps, 
            DeclarationSteps declarationSteps,
            WaitingRoomSteps waitingRoomSteps, 
            BrowserSteps browserSteps)
        {
            _c = testContext;
            _dataSetupSteps = dataSetupSteps;
            _loginSteps = loginSteps;
            _hearingListSteps = hearingListSteps;
            _vhoHearingListSteps = vhoHearingListSteps;
            _introductionSteps = introductionSteps;
            _equipmentCheckSteps = equipmentCheckSteps;
            _switchOnCamAndMicSteps = switchOnCamAndMicSteps;
            _waitingRoomSteps = waitingRoomSteps;
            _browserSteps = browserSteps;
            _practiceVideoHearingSteps = practiceVideoHearingSteps;
            _equipmentWorkingSteps = equipmentWorkingSteps;
            _rulesSteps = rulesSteps;
            _declarationSteps = declarationSteps;
            _hearingRoomSteps = hearingRoomSteps;
        }

        [Given(@"the (.*) user has progressed to the (.*) page")]
        public void GivenIAmOnThePage(string user, string page)
        {
            _dataSetupSteps.GivenIHaveAHearing(0);
            _dataSetupSteps.GetTheNewConferenceDetails();
            _browserSteps.GivenANewBrowserIsOpenFor(user.ToLower().Contains("self test") ? user.Split(" ")[0] : user);
            Progression(FromString(user), page);
        }

        [Given(@"the (.*) user has progressed to the (.*) page with a hearing in (.*) minute time")]
        [Given(@"the (.*) user has progressed to the (.*) page with a hearing in (.*) minutes time")]
        public void GivenIAmOnThePageWithAHearingInMinuteTime(string user, string page, int minutes)
        {
            _dataSetupSteps.GivenIHaveAHearing(minutes);
            _dataSetupSteps.GetTheNewConferenceDetails();
            _browserSteps.GivenANewBrowserIsOpenFor(user);
            Progression(FromString(user), page);
        }

        [Given(@"the (.*) user has progressed to the (.*) page for the existing hearing")]
        [When(@"the (.*) user has progressed to the (.*) page for the existing hearing")]
        public void GivenHearingExistsAndIAmOnThePage(string user, string page)
        {
            _browserSteps.GivenANewBrowserIsOpenFor(user.ToLower().Equals("clerk self test") ? "clerk" : user);
            Progression(FromString(user), page);
        }

        private static Journey FromString(string user)
        {
            if (RemoveNumbersFromUsername(user.ToLower()) == "clerk" ||
                RemoveNumbersFromUsername(user.ToLower()) == "judge")
                return Journey.Clerk;
            if (RemoveNumbersFromUsername(user.ToLower()) == "clerk self test")
                return Journey.ClerkSelftest;
            if (RemoveNumbersFromUsername(user.ToLower()) == "individual self test" ||
                     RemoveNumbersFromUsername(user.ToLower()) == "representative self test")
                return Journey.SelfTest; 
            if (RemoveNumbersFromUsername(user.ToLower()) == "participant" ||
                     RemoveNumbersFromUsername(user.ToLower()) == "individual" ||
                     RemoveNumbersFromUsername(user.ToLower()) == "representative")
                return Journey.Participant;
            if (RemoveNumbersFromUsername(user.ToLower()) == "video hearings officer") 
                return Journey.Vho;

            throw new ArgumentOutOfRangeException($"No user journey found for '{user}'");
        }

        private static string RemoveNumbersFromUsername(string user)
        {
            return Regex.Replace(user, @"[\d-]", string.Empty);
        }

        private void Progression(Journey userJourney, string pageAsString)
        {
            var endPage = Page.FromString(pageAsString);
            var journeys = new Dictionary<Journey, IJourney>
            {
                {Journey.Clerk, new ClerkJourney()},
                {Journey.ClerkSelftest, new ClerkSelfTestJourney()},
                {Journey.Participant, new ParticipantJourney()},
                {Journey.SelfTest, new SelfTestJourney()},
                {Journey.Vho, new VhoJourney()}
            };
            journeys[userJourney].VerifyUserIsApplicableToJourney(_c.CurrentUser.Role);
            journeys[userJourney].VerifyDestinationIsInThatJourney(endPage);
            if (userJourney == Journey.ClerkSelftest || userJourney == Journey.SelfTest) _c.Test.SelfTestJourney = true;           
            var journey = journeys[userJourney].Journey();
            var steps = Steps();
            foreach (var page in journey)
            {
                if (page != Page.Login) _browserSteps.ThenTheUserIsOnThePage(page.Name);
                if (page.Equals(endPage)) break;
                steps[page].ProgressToNextPage();
            }
        }

        private Dictionary<Page, ISteps> Steps()
        {
            return new Dictionary<Page, ISteps>
            {
                {Page.Login, _loginSteps},
                {Page.HearingList, _hearingListSteps},
                {Page.VhoHearingList, _vhoHearingListSteps},
                {Page.Introduction, _introductionSteps},
                {Page.EquipmentCheck, _equipmentCheckSteps},
                {Page.SwitchOnCamAndMic, _switchOnCamAndMicSteps},
                {Page.PracticeVideoHearing, _practiceVideoHearingSteps},
                {Page.CameraWorking, _equipmentWorkingSteps},
                {Page.MicrophoneWorking, _equipmentWorkingSteps},
                {Page.SeeAndHearVideo, _equipmentWorkingSteps},
                {Page.Rules, _rulesSteps},
                {Page.Declaration, _declarationSteps},
                {Page.WaitingRoom, _waitingRoomSteps},
                {Page.HearingRoom, _hearingRoomSteps}
            };
        }

        [When(@"the Participant user navigates from the Equipment Check page back to the (.*) page")]
        public void WhenTheParticipantUserNavigatesFromTheEquipmentCheckPageBackToTheSeeAndHearVideoPage(string endPage)
        {
            var page = Page.FromString(endPage);
            var steps = Steps();
            steps[Page.EquipmentCheck].ProgressToNextPage();
            steps[Page.SwitchOnCamAndMic].ProgressToNextPage();
            steps[Page.PracticeVideoHearing].ProgressToNextPage();
            if (page.Equals(Page.MicrophoneWorking) || page.Equals(Page.SeeAndHearVideo))
                steps[Page.CameraWorking].ProgressToNextPage();

            if (page.Equals(Page.SeeAndHearVideo))
                steps[Page.MicrophoneWorking].ProgressToNextPage();
        }
    }
}
