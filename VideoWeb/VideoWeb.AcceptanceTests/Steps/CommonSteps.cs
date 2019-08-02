using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using FluentAssertions;
using OpenQA.Selenium.Support.Extensions;
using TechTalk.SpecFlow;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.AcceptanceTests.Journeys;
using VideoWeb.AcceptanceTests.Pages;
using VideoWeb.AcceptanceTests.Users;
using TestContext = VideoWeb.AcceptanceTests.Contexts.TestContext;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public class CommonSteps
    {
        private readonly TimeSpan _shortTimeout = TimeSpan.FromSeconds(30);
        private readonly TimeSpan _longTimeout = TimeSpan.FromSeconds(90);
        private readonly TestContext _tc;
        private readonly ScenarioContext _scenario;
        private readonly Dictionary<string, UserBrowser> _browsers;
        private readonly CommonPages _commonPages;
        private readonly DataSetupSteps _dataSetupSteps;
        private readonly LoginSteps _loginSteps;
        private readonly HearingsListSteps _hearingListSteps;
        private readonly PracticeVideoHearingPage _practiceVideoHearingPage;
        private readonly DeclarationSteps _declarationSteps;
        private Page _currentPage = Page.Login;

        public CommonSteps(TestContext testContext, ScenarioContext scenario, Dictionary<string, UserBrowser> browsers, CommonPages commonPages,
            DataSetupSteps dataSetupSteps, LoginSteps loginSteps, HearingsListSteps hearingDetailsSteps,
            PracticeVideoHearingPage practiceVideoHearingPage, DeclarationSteps declarationSteps)
        {
            _tc = testContext;
            _scenario = scenario;
            _browsers = browsers;
            _commonPages = commonPages;
            _dataSetupSteps = dataSetupSteps;
            _loginSteps = loginSteps;
            _hearingListSteps = hearingDetailsSteps;
            _practiceVideoHearingPage = practiceVideoHearingPage;
            _declarationSteps = declarationSteps;
        }

        [Given(@"a new browser is open for user (.*)")]
        [Given(@"a new browser is open for a (.*)")]
        [Given(@"a new browser is open for an (.*)")]
        public void GivenANewBrowserIsOpenFor(string user)
        {
            SwitchCurrentUser(user);

            var browser = new UserBrowser(_tc.CurrentUser, _tc);
            _browsers.Add(_tc.CurrentUser.Key, browser);

            browser.LaunchBrowser();
            browser.NavigateToPage();

            browser.Retry(() => browser.PageUrl().Should().Contain("login.microsoftonline.com"), 10);
        }

        [Given(@"in the (.*)'s browser")]
        [When(@"in the (.*)'s browser")]
        [Then(@"in the (.*)'s browser")]
        public void GivenInTheUsersBrowser(string user)
        {
            SwitchCurrentUser(user);

            _browsers[_tc.CurrentUser.Key].Driver.SwitchTo().Window(_browsers[_tc.CurrentUser.Key].LastWindowName);
        }

        private void SwitchCurrentUser(string user)
        {
            if (_tc.CurrentUser != null)
                _browsers[_tc.CurrentUser.Key].LastWindowName =
                    _browsers[_tc.CurrentUser.Key].Driver.WrappedDriver.WindowHandles.Last();

            _tc.CurrentUser = user.ToLower().Equals("participant") ? _tc.TestSettings.UserAccounts.First(x => x.Lastname.ToLower().Equals(_tc.DefaultParticipant.Lastname.ToLower())) : _tc.TestSettings.UserAccounts.First(x => x.Displayname.ToLower().Contains(user.ToLower().Replace(" ", "")));          

            if (_tc.CurrentUser == null)
                throw new ArgumentOutOfRangeException($"There are no users configured called '{user}'");
        }

        [Given(@"the (.*) user has progressed to the (.*) page")]
        public void GivenIAmOnThePage(string user, string pageName)
        {
            Progress(user, pageName, 0);
        }

        [Given(@"the (.*) user has progressed to the (.*) page with a hearing in (.*) minutes time")]
        public void GivenIAmOnThePageWithAHearingInMinuteTime(string user, string pageName, int minutes)
        {
            Progress(user, pageName, minutes);
        }

        [Given(@"the (.*) user has progressed to the (.*) page for the existing hearing")]
        public void GivenHearingExistsAndIAmOnThePage(string user, string pageName)
        {
            _currentPage = Page.Login;
            Progress(user, pageName, 0, false);
        }

        [When(@"the (.*) user navigates from the Equipment Check page back to the (.*) page")]
        public void WhenTheUserNavigatesBackToTheCameraWorkingPage(string user, string pageName)
        {
            _currentPage = Page.EquipmentCheck;
            Progress(user, pageName, 0, false);
        }

        private void Progress(string user, string pageName, int minutes, bool createHearing = true)
        {
            if (!pageName.Equals("Hearings Page") && createHearing)
            {
                _dataSetupSteps.GivenIHaveAHearing(minutes);
                _dataSetupSteps.GetTheNewConferenceDetails();
            }

            var timeout = _scenario.ScenarioInfo.Tags.Contains("Video") ? _longTimeout : _shortTimeout;

            var timer = new Stopwatch();
            timer.Start();

            while (_currentPage.Name != pageName && timer.Elapsed <= timeout)
            {               
                ProgressToNextPage(user, _currentPage);

                if (timer.Elapsed <= timeout)
                {
                    timer.Restart();
                }
            }

            timer.Stop();

            if (timer.Elapsed > timeout)
            {
                throw new TimeoutException("The elapsed time exceeded the allowed limit to reach the page");
            }
        }

        private void ProgressToNextPage(string user, Page currentPage)
        {
            if (user.Equals("Judge") || user.Equals("Clerk"))
            {
                switch (currentPage.JudgeJourney)
                {
                    case JudgeJourney.Login:
                    {
                        GivenANewBrowserIsOpenFor(user);
                        _loginSteps.WhenUserLogsInWithValidCredentials();
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

            if (user.Equals("ClerkSelfTest"))
            {
                switch (currentPage.ClerkSelfTestJourney)
                {
                    case ClerkSelfTestJourney.Login:
                    {
                        GivenANewBrowserIsOpenFor("Clerk");
                            _loginSteps.WhenUserLogsInWithValidCredentials();
                        break;
                    }
                    case ClerkSelfTestJourney.HearingList:
                    {
                        _hearingListSteps.WhenTheUserClicksTheCheckEquipmentButton();
                        break;
                    }
                    case ClerkSelfTestJourney.EquipmentCheck:
                    {
                        WhentheUserClicksTheButton("Continue");
                        break;
                    }
                    case ClerkSelfTestJourney.SwitchOnYourCameraAndMicrophone:
                    {
                        WhentheUserClicksTheButton("Switch on");
                        WhentheUserClicksTheButton("Watch video");
                        break;
                    }
                    case ClerkSelfTestJourney.PracticeVideoHearing:
                    {
                        break;
                    }
                    default:
                        throw new InvalidOperationException($"Current page was past the intended page: {currentPage}");
                }

                _currentPage = currentPage.ClerkSelfTestNextPage(currentPage);

            }

            if (user.Contains("Officer"))
            {
                switch (currentPage.VhoJourney)
                {
                    case VhoJourney.Login:
                        {
                            GivenANewBrowserIsOpenFor(user);
                            _loginSteps.WhenUserLogsInWithValidCredentials();
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

            if (user.Contains("Individual") || user.Contains("Representative") || user.ToLower().Contains("participant"))
            {
                switch (currentPage.ParticipantJourney)
                {
                    case ParticipantJourney.Login:
                        {
                            GivenANewBrowserIsOpenFor(user);
                            _loginSteps.WhenUserLogsInWithValidCredentials();
                            break;
                        }
                    case ParticipantJourney.HearingList:
                        {
                            _hearingListSteps.WhenTheUserClicksTheStartButton();
                            break;
                        }
                    case ParticipantJourney.Introduction:
                        {
                            WhentheUserClicksTheButtonWithInnertext("Next");
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
                        _browsers[_tc.CurrentUser.Key].Driver.WaitUntilElementVisible(_practiceVideoHearingPage.IncomingVideo)
                            .Displayed.Should().BeTrue();

                        _browsers[_tc.CurrentUser.Key].Driver.ExecuteJavaScript("arguments[0].scrollIntoView(true);", _browsers[_tc.CurrentUser.Key].Driver.FindElement(CommonLocators.ButtonWithLabel("Continue")));
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

            _browsers[_tc.CurrentUser.Key].Retry(() => _commonPages.PageUrl(_currentPage.Url));
        }

        [When(@"the user clicks the (.*) button")]
        public void WhentheUserClicksTheButton(string label)
        {
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilElementVisible(CommonLocators.ButtonWithLabel(label))
                .Displayed.Should().BeTrue();

            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilElementVisible(CommonLocators.ButtonWithLabel(label)).Click();
        }

        [When(@"the user clicks the button with innertext (.*)")]
        public void WhentheUserClicksTheButtonWithInnertext(string innertext)
        {
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilElementVisible(CommonLocators.ButtonWithInnertext(innertext))
                .Displayed.Should().BeTrue();

            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilElementVisible(CommonLocators.ButtonWithInnertext(innertext)).Click();
        }

        [When(@"the user selects the (.*) radiobutton")]
        public void WhenTheUserSelectsTheRadiobutton(string label)
        {
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilElementExists(CommonLocators.RadioButtonWithLabel(label)).Click();
        }

        [When(@"the user clicks the (.*) link")]
        public void WhenTheUserClicksTheChangeCameraOrMicrophoneLink(string linktext)
        {
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilElementVisible(CommonLocators.LinkWithText(linktext)).Displayed
                .Should().BeTrue();
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilElementVisible(CommonLocators.LinkWithText(linktext)).Click();
        }

        [Then(@"contact us details are available")]
        public void ThenContactUsDetailsWillBeAvailable()
        {
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilElementVisible(_commonPages.ContactUsLink)
                .Displayed.Should().BeTrue();

            if (!_browsers[_tc.CurrentUser.Key].Driver.Url.Contains(Page.HearingList.Url)) return;

            if (_tc.Hearing != null)
            {
                _commonPages.TheCaseNumberIsDisplayedInTheContactDetails(_tc.Hearing.Cases.First().Number)
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
                case "Introduction": _commonPages.PageUrl(Page.Introduction); break;
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
                case "Help": _commonPages.PageUrl(Page.Help); break;
                case "Admin Panel": _commonPages.PageUrl(Page.AdminPanel); break;
                default: throw new ArgumentOutOfRangeException(page);
            }
        }

        [Then(@"the (.*) error message appears")]
        public void ThenTheErrorMessageAppears(string errorText)
        {
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilElementVisible(CommonLocators.ErrorMessage).Text.Replace("Error:", "")
                .Should().Contain(errorText);
        }

        [Then(@"the (.*) button is disabled")]
        public void ThenTheButtonIsDisabled(string label)
        {
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilElementVisible(CommonLocators.ButtonWithLabel(label)).GetAttribute("class")
                .Should().Contain("disabled");
        }
   }
}

