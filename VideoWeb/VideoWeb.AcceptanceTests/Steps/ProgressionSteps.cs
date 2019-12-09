﻿using System;
using System.Collections.Generic;
using System.Text.RegularExpressions;
using TechTalk.SpecFlow;
using VideoWeb.AcceptanceTests.Contexts;
using VideoWeb.AcceptanceTests.Journeys;
using VideoWeb.AcceptanceTests.Pages;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public class ProgressionSteps
    {
        private readonly TestContext _tc;
        private readonly DataSetupSteps _dataSetupSteps;
        private readonly CommonSteps _commonSteps;
        private readonly CommonPages _commonPages;
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
            CommonSteps commonSteps,
            CommonPages commonPages,
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
            WaitingRoomSteps waitingRoomSteps)
        {
            _tc = testContext;
            _dataSetupSteps = dataSetupSteps;
            _commonSteps = commonSteps;
            _commonPages = commonPages;
            _loginSteps = loginSteps;
            _hearingListSteps = hearingListSteps;
            _vhoHearingListSteps = vhoHearingListSteps;
            _introductionSteps = introductionSteps;
            _equipmentCheckSteps = equipmentCheckSteps;
            _switchOnCamAndMicSteps = switchOnCamAndMicSteps;
            _waitingRoomSteps = waitingRoomSteps;
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
            _commonSteps.GivenANewBrowserIsOpenFor(user.ToLower().Contains("self test") ? user.Split(" ")[0] : user);
            Progression(FromString(user), page);
        }

        [Given(@"the (.*) user has progressed to the (.*) page with a hearing in (.*) minute time")]
        [Given(@"the (.*) user has progressed to the (.*) page with a hearing in (.*) minutes time")]
        public void GivenIAmOnThePageWithAHearingInMinuteTime(string user, string page, int minutes)
        {
            _dataSetupSteps.GivenIHaveAHearing(minutes);
            _dataSetupSteps.GetTheNewConferenceDetails();
            _commonSteps.GivenANewBrowserIsOpenFor(user);
            Progression(FromString(user), page);
        }

        [Given(@"the (.*) user has progressed to the (.*) page for the existing hearing")]
        public void GivenHearingExistsAndIAmOnThePage(string user, string page)
        {
            _commonSteps.GivenANewBrowserIsOpenFor(user.ToLower().Equals("clerk self test") ? "clerk" : user);
            Progression(FromString(user), page);
        }

        private static Journey FromString(string user)
        {
            if (RemoveNumbersFromUsername(user.ToLower()) == "clerk" ||
                RemoveNumbersFromUsername(user.ToLower()) == "judge")
                return Journey.Clerk;
            else if (RemoveNumbersFromUsername(user.ToLower()) == "clerk self test")
                return Journey.ClerkSelftest;
            else if (RemoveNumbersFromUsername(user.ToLower()) == "representative self test")
                return Journey.RepSelfTest;
            else if (RemoveNumbersFromUsername(user.ToLower()) == "participant" ||
                     RemoveNumbersFromUsername(user.ToLower()) == "individual" ||
                     RemoveNumbersFromUsername(user.ToLower()) == "representative")
                return Journey.Participant;
            else if (RemoveNumbersFromUsername(user.ToLower()) == "video hearings officer") return Journey.Vho;

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
                {Journey.RepSelfTest, new RepSelfTestJourney()},
                {Journey.Vho, new VhoJourney()}
            };
            journeys[userJourney].VerifyUserIsApplicableToJourney(_tc.CurrentUser.Role);
            journeys[userJourney].VerifyDestinationIsInThatJourney(endPage);
            if (userJourney == Journey.ClerkSelftest || userJourney == Journey.RepSelfTest) _tc.Selftest = true;           
            var journey = journeys[userJourney].Journey();
            var steps = Steps();
            foreach (var page in journey)
            {
                if (page != Page.Login) _commonPages.PageUrl(page.Url);
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