using System;
using System.Linq;
using FluentAssertions;
using TechTalk.SpecFlow;
using VideoWeb.AcceptanceTests.Contexts;
using VideoWeb.AcceptanceTests.Helpers;
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
            if (!pageName.Equals("Hearings Page"))
            {
                _dataSetupSteps.GivenIHaveAHearing();
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
            else {

                switch (currentPage.Journey)
                {
                    case Journey.Login:
                    {
                        _loginSteps.WhenUserLogsInWithValidCredentials(role);
                            break;
                    }
                    case Journey.HearingList:
                    {
                        _hearingListSteps.WhenTheUserClicksTheStartButton();
                            break;
                    }
                    case Journey.SwitchOnYourCameraAndMicrophone:
                    {
                        WhentheUserClicksTheButton("Switch on");
                        WhentheUserClicksTheButton("Watch video");
                            break;
                    }
                    case Journey.CameraWorking:
                    case Journey.MicrophoneWorking:
                    case Journey.SeeAndHearVideo:
                    {
                        WhenTheUserSelectsTheRadiobutton("Yes");
                        WhentheUserClicksTheButton("Continue");
                            break;
                    }
                    case Journey.EquipmentCheck:
                    case Journey.Rules:
                    {
                        WhentheUserClicksTheButton("Continue");
                            break;
                    }
                    case Journey.Declaration:
                    {
                        _declarationSteps.WhenTheUserGivesTheirConsent();
                        WhentheUserClicksTheButton("Continue");
                            break;
                    }
                    case Journey.WaitingRoom:
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

            _browserContext.NgDriver.FindElement(CommonLocators.RadioButtonWithLabel(label)).Click();
        }

        [Then(@"contact us details are available")]
        public void ThenContactUsDetailsWillBeAvailable()
        {
            _browserContext.NgDriver.WaitUntilElementVisible(_commonPages.ContactUsLink).Displayed
                .Should().BeTrue();
            if (_browserContext.NgDriver.Url.Contains(Page.HearingList.Url))
            {
                if (_context.Hearing != null)
                {
                    _commonPages.TheCaseNumberIsDisplayedInTheContactDetails(_context.Hearing.Cases.First().Number)
                        .Should().BeFalse();
                }
            }
            else
            {
                _commonPages.TheCaseNumberIsDisplayedInTheContactDetails(_context.Hearing.Cases.First().Number)
                    .Should().BeTrue();
            }
        }

        [Then(@"the user is on the (.*) page")]
        public void ThenTheUserIsOnThePage(string page)
        {
            switch (page)
            {
                case "Login": _browserContext.Retry(() => _commonPages.PageUrl(Page.Login)); break;
                case "Hearings List": _browserContext.Retry(() => _commonPages.PageUrl(Page.HearingList)); break;
                case "Equipment Check": _browserContext.Retry(() => _commonPages.PageUrl(Page.EquipmentCheck)); break;
                case "Switch on your camera and microphone": _browserContext.Retry(() => _commonPages.PageUrl(Page.SwitchOnCamAndMicPage)); break;
                case "Camera Working": _browserContext.Retry(() => _commonPages.PageUrl(Page.CameraWorking)); break;
                case "Microphone Working": _browserContext.Retry(() => _commonPages.PageUrl(Page.MicrophoneWorking)); break;
                case "See and Hear Video": _browserContext.Retry(() => _commonPages.PageUrl(Page.SeeAndHearVideo)); break;
                case "Rules": _browserContext.Retry(() => _commonPages.PageUrl(Page.Rules)); break;
                case "Declaration": _browserContext.Retry(() => _commonPages.PageUrl(Page.Declaration)); break;
                case "Waiting Room": _browserContext.Retry(() => _commonPages.PageUrl(Page.WaitingRoom)); break;
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

