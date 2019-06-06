﻿using System;
using System.Linq;
using FluentAssertions;
using TechTalk.SpecFlow;
using VideoWeb.AcceptanceTests.Contexts;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.AcceptanceTests.Journeys;
using VideoWeb.AcceptanceTests.Pages;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public class CommonSteps
    {
        private readonly TestContext _context;
        private readonly BrowserContext _browserContext;
        private readonly CommonPages _commonPages;
        private readonly DataSetupSteps _dataSetupSteps;
        private readonly LoginSteps _loginSteps;
        private readonly HearingsListSteps _hearingListSteps;
        private readonly EquipmentCheckSteps _equipmentCheckSteps;
        private readonly SwitchOnCamAndMicSteps _switchOnCamAndMicSteps;
        private readonly CameraWorkingSteps _cameraMicrophoneSteps;
        private readonly RulesSteps _rulesSteps;
        private readonly DeclarationSteps _declarationSteps;
        private readonly WaitingRoomSteps _waitingRoomSteps;
        private Page _currentPage = Page.Login;

        public CommonSteps(TestContext context, BrowserContext browserContext, CommonPages commonPages, 
            DataSetupSteps dataSetupSteps, LoginSteps loginSteps, HearingsListSteps hearingDetailsSteps,
            EquipmentCheckSteps equipmentCheckSteps, SwitchOnCamAndMicSteps switchOnCamAndMicSteps,
            CameraWorkingSteps cameraMicrophoneSteps, RulesSteps rulesSteps,
            DeclarationSteps declarationSteps, WaitingRoomSteps waitingRoomSteps)
        {
            _context = context;
            _browserContext = browserContext;
            _commonPages = commonPages;
            _dataSetupSteps = dataSetupSteps;
            _loginSteps = loginSteps;
            _hearingListSteps = hearingDetailsSteps;
            _equipmentCheckSteps = equipmentCheckSteps;
            _switchOnCamAndMicSteps = switchOnCamAndMicSteps;
            _cameraMicrophoneSteps = cameraMicrophoneSteps;
            _rulesSteps = rulesSteps;
            _declarationSteps = declarationSteps;
            _waitingRoomSteps = waitingRoomSteps;
        }

        [Given(@"the (.*) user has progressed to the (.*) page")]
        public void GivenIAmOnThePage(string role, string pageName)
        {
            Progress(role, pageName, 0);
        }

        [Given(@"the (.*) user has progressed to the (.*) page with a hearing in (.*) minutes time")]
        public void GivenIAmOnThePage(string role, string pageName, int minutes)
        {
            Progress(role, pageName, minutes);
        }

        private void Progress(string role, string pageName, int minutes)
        {
            if (!pageName.Equals("Hearings Page"))
            {
                _dataSetupSteps.GivenIHaveAHearing(minutes);
                _dataSetupSteps.GivenIHaveAConference();
            }

            while (_currentPage.Name != pageName)
            {
                ProgressToNextPage(role, _currentPage);
            }
        }

        private void ProgressToNextPage(string role, Page currentPage)
        {
            if (role.Equals("Judge"))
            {
                switch (currentPage.JudgeJourney)
                {
                    case JudgeJourney.Login:
                    {
                        _loginSteps.WhenUserLogsInWithValidCredentials(role);
                        break;
                    }
                    case JudgeJourney.HearingList:
                    {
                        _hearingListSteps.WhenTheUserClicksTheStartButton();
                        break;
                    }
                    case JudgeJourney.WaitingRoom:
                    {
                        break;
                    }
                    default:
                        throw new InvalidOperationException($"Current page was past the intended page: {currentPage}");
                }

                _currentPage = currentPage.JudgeNextPage(currentPage);

            }

            if (role.Equals("Video Hearings Officer"))
            {
                switch (currentPage.VhoJourney)
                {
                    case VhoJourney.Login:
                    {
                        _loginSteps.WhenUserLogsInWithValidCredentials(role);
                        break;
                    }
                    case VhoJourney.HearingList:
                    {
                        _hearingListSteps.WhenTheVHOSelectsTheHearing();
                        break;
                    }
                    case VhoJourney.AdminPanel:
                    {
                        break;
                    }
                    default:
                        throw new InvalidOperationException($"Current page was past the intended page: {currentPage}");
                }

                _currentPage = currentPage.VhoNextPage(currentPage);
            }

            if (role.Equals("Individual") || role.Equals("Representative"))
            {
                switch (currentPage.ParticipantJourney)
                {
                    case ParticipantJourney.Login:
                    {
                        _loginSteps.WhenUserLogsInWithValidCredentials(role);
                            break;
                    }
                    case ParticipantJourney.HearingList:
                    {
                        _hearingListSteps.WhenTheUserClicksTheStartButton();
                            break;
                    }
                    case ParticipantJourney.SwitchOnYourCameraAndMicrophone:
                    {
                        WhentheUserClicksTheButton("Switch on");
                        WhentheUserClicksTheButton("Watch video");
                            break;
                    }
                    case ParticipantJourney.CameraWorking:
                    case ParticipantJourney.MicrophoneWorking:
                    case ParticipantJourney.SeeAndHearVideo:
                    {
                        WhenTheUserSelectsTheRadiobutton("Yes");
                        WhentheUserClicksTheButton("Continue");
                            break;
                    }
                    case ParticipantJourney.PracticeVideoHearing:
                    case ParticipantJourney.EquipmentCheck:
                    case ParticipantJourney.Rules:
                    {
                        WhentheUserClicksTheButton("Continue");
                            break;
                    }
                    case ParticipantJourney.Declaration:
                    {
                        _declarationSteps.WhenTheUserGivesTheirConsent();
                        WhentheUserClicksTheButton("Continue");
                            break;
                    }
                    case ParticipantJourney.WaitingRoom:
                    {
                        break;
                    }
                    default:
                        throw new InvalidOperationException($"Current page was past the intended page: {currentPage}");
                }
                _currentPage = currentPage.NextPage(currentPage);
            }

            _browserContext.Retry(() => _commonPages.PageUrl(_currentPage.Url));
        }

        [When(@"the user clicks the (.*) button")]
        public void WhentheUserClicksTheButton(string label)
        {
            _browserContext.NgDriver.WaitUntilElementVisible(CommonLocators.ButtonWithLabel(label)).Displayed
                .Should().BeTrue();
            _browserContext.NgDriver.WaitUntilElementVisible(CommonLocators.ButtonWithLabel(label)).Click();
        }

        [When(@"the user selects the (.*) radiobutton")]
        public void WhenTheUserSelectsTheRadiobutton(string label)
        {

            _browserContext.NgDriver.WaitUntilElementExists(CommonLocators.RadioButtonWithLabel(label)).Click();
        }

        [Then(@"contact us details are available")]
        public void ThenContactUsDetailsWillBeAvailable()
        {
            _browserContext.NgDriver.WaitUntilElementVisible(_commonPages.ContactUsLink).Displayed
                .Should().BeTrue();
            if (!_browserContext.NgDriver.Url.Contains(Page.HearingList.Url)) return;
            if (_context.Hearing != null)
            {
                _commonPages.TheCaseNumberIsDisplayedInTheContactDetails(_context.Hearing.Cases.First().Number)
                    .Should().BeFalse();
            }
        }

        [Then(@"the user is on the (.*) page")]
        public void ThenTheUserIsOnThePage(string page)
        {
            switch (page)
            {
                case "Login": _commonPages.PageUrl(Page.Login); break;
                case "Hearings List": _commonPages.PageUrl(Page.HearingList); break;
                case "Equipment Check": _commonPages.PageUrl(Page.EquipmentCheck); break;
                case "Switch on your camera and microphone": _commonPages.PageUrl(Page.SwitchOnCamAndMicPage); break;
                case "Practice video hearing": _commonPages.PageUrl(Page.PracticeVideoHearing); break;
                case "Camera Working": _commonPages.PageUrl(Page.CameraWorking); break;
                case "Microphone Working": _commonPages.PageUrl(Page.MicrophoneWorking); break;
                case "See and Hear Video": _commonPages.PageUrl(Page.SeeAndHearVideo); break;
                case "Rules": _commonPages.PageUrl(Page.Rules); break;
                case "Declaration": _commonPages.PageUrl(Page.Declaration); break;
                case "Waiting Room": _commonPages.PageUrl(Page.WaitingRoom); break;
                case "Not Found": _commonPages.PageUrl(Page.NotFound); break;
                case "Unauthorised": _commonPages.PageUrl(Page.Unauthorised); break;
                case "Admin Panel": _commonPages.PageUrl(Page.AdminPanel); break;
                default: throw new ArgumentOutOfRangeException(page);
            }
        }

        [Then(@"the (.*) error message appears")]
        public void ThenTheErrorMessageAppears(string errorText)
        {
            _browserContext.NgDriver.WaitUntilElementVisible(CommonLocators.ErrorMessage).Text.Replace("Error:","")
                .Should().Contain(errorText);
        }

        [Then(@"the (.*) button is disabled")]
        public void ThenTheButtonIsDisabled(string label)
        {
            _browserContext.NgDriver.WaitUntilElementVisible(CommonLocators.ButtonWithLabel(label)).GetAttribute("class")
                .Should().Contain("disabled");
        }

    }
}

