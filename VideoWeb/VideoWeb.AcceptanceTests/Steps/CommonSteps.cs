using System;
using System.Linq;
using FluentAssertions;
using OpenQA.Selenium.Support.Extensions;
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
        private BrowserContext _browserContext;
        private readonly CommonPages _commonPages;
        private readonly DataSetupSteps _dataSetupSteps;
        private readonly LoginSteps _loginSteps;
        private readonly HearingsListSteps _hearingListSteps;
        private readonly PracticeVideoHearingPage _practiceVideoHearingPage;
        private readonly DeclarationSteps _declarationSteps;
        private Page _currentPage = Page.Login;

        public CommonSteps(TestContext context, BrowserContext browserContext, CommonPages commonPages,
            DataSetupSteps dataSetupSteps, LoginSteps loginSteps, HearingsListSteps hearingDetailsSteps,
            PracticeVideoHearingPage practiceVideoHearingPage, DeclarationSteps declarationSteps)
        {
            _context = context;
            _browserContext = browserContext;
            _commonPages = commonPages;
            _dataSetupSteps = dataSetupSteps;
            _loginSteps = loginSteps;
            _hearingListSteps = hearingDetailsSteps;
            _practiceVideoHearingPage = practiceVideoHearingPage;
            _declarationSteps = declarationSteps;
        }

        [Given(@"there is a new browser open for (.*)")]
        public void GivenAnotherBrowserWindowIsLaunched(string participant)
        {
            _context.Drivers.Add(_context.TestSettings.UserAccounts.Find(x => x.Lastname.Contains(participant)).Username, _browserContext);
            _context.WrappedDrivers.Add(_context.TestSettings.UserAccounts.Find(x => x.Lastname.Contains(participant)).Username, _browserContext.NgDriver.WrappedDriver);
            _browserContext.BrowserSetup(_context.VideoWebUrl, _context.Environment, participant);
            _browserContext.NavigateToPage();
        }

        [Given(@"in the (.*)'s browser")]
        [When(@"in the (.*)'s browser")]
        [Then(@"in the (.*)'s browser")]
        public void GivenInTheParticipantsBrowser(string participant)
        {
            var username = _context.TestSettings.UserAccounts.First(x => x.Lastname.Equals(participant))?.Username;
            if (username == null)
            {
                throw new ArgumentOutOfRangeException($"There are no users with lastname '{participant}'");
            }

            _context.Drivers.Remove(username);
            _context.Drivers.Add(username, _browserContext);
            _browserContext = _context.Drivers.FirstOrDefault(x => x.Key.Equals(username)).Value;
        }

        [Given(@"the (.*) user has progressed to the (.*) page")]
        public void GivenIAmOnThePage(string role, string pageName)
        {
            Progress(role, pageName, 0);
        }

        [Given(@"the (.*) user has progressed to the (.*) page with a hearing in (.*) minutes time")]
        public void GivenIAmOnThePageWithAHearingInMinuteTime(string role, string pageName, int minutes)
        {
            Progress(role, pageName, minutes);
        }

        [Given(@"the (.*) user has progressed to the (.*) page for the existing hearing")]
        public void GivenHearingExistsAndIAmOnThePage(string role, string pageName)
        {
            _currentPage = Page.Login;
            Progress(role, pageName, 0, false);
        }

        private void Progress(string role, string pageName, int minutes, bool createHearing = true)
        {
            if (!pageName.Equals("Hearings Page") && createHearing)
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
                            WhentheUserClicksTheButtonWithInnertext("Start Hearing");
                            break;
                        }
                    case JudgeJourney.Countdown:
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
                        _hearingListSteps.WhenTheVhoSelectsTheHearing();
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

            if (role.Contains("Individual") || role.Contains("Representative"))
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
                    {
                        _browserContext.NgDriver.WaitUntilElementVisible(_practiceVideoHearingPage.IncomingVideo)
                            .Displayed.Should().BeTrue();
                        _browserContext.NgDriver.ExecuteJavaScript("arguments[0].scrollIntoView(true);", _browserContext.NgDriver.FindElement(CommonLocators.ButtonWithLabel("Continue")));
                            WhentheUserClicksTheButton("Continue");
                            break;
                        }
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

        [When(@"the user clicks the button with innertext (.*)")]
        public void WhentheUserClicksTheButtonWithInnertext(string innertext)
        {
            _browserContext.NgDriver.WaitUntilElementVisible(CommonLocators.ButtonWithInnertext(innertext)).Displayed
                .Should().BeTrue();
            _browserContext.NgDriver.WaitUntilElementVisible(CommonLocators.ButtonWithInnertext(innertext)).Click();
        }

        [When(@"the user selects the (.*) radiobutton")]
        public void WhenTheUserSelectsTheRadiobutton(string label)
        {
            _browserContext.NgDriver.WaitUntilElementExists(CommonLocators.RadioButtonWithLabel(label)).Click();
        }

        [When(@"the user clicks the (.*) link")]
        public void WhenTheUserClicksTheChangeCameraOrMicrophoneLink(string linktext)
        {
            _browserContext.NgDriver.WaitUntilElementVisible(CommonLocators.LinkWithText(linktext)).Displayed
                .Should().BeTrue();
            _browserContext.NgDriver.WaitUntilElementVisible(CommonLocators.LinkWithText(linktext)).Click();
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
                case "Countdown": _commonPages.PageUrl(Page.Countdown); break;
                case "Hearing Room": _commonPages.PageUrl(Page.HearingRoom); break;
                case "Not Found": _commonPages.PageUrl(Page.NotFound); break;
                case "Unauthorised": _commonPages.PageUrl(Page.Unauthorised); break;
                case "Admin Panel": _commonPages.PageUrl(Page.AdminPanel); break;
                default: throw new ArgumentOutOfRangeException(page);
            }
        }

        [Then(@"the (.*) error message appears")]
        public void ThenTheErrorMessageAppears(string errorText)
        {
            _browserContext.NgDriver.WaitUntilElementVisible(CommonLocators.ErrorMessage).Text.Replace("Error:", "")
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

