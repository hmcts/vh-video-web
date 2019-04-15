using System;
using FluentAssertions;
using TechTalk.SpecFlow;
using VideoWeb.AcceptanceTests.Contexts;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.AcceptanceTests.Pages;
using TestContext = VideoWeb.AcceptanceTests.Contexts.TestContext;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public class CommonSteps
    {
        private readonly BrowserContext _browserContext;
        private readonly CommonPages _commonPages;
        private readonly DataSetupSteps _dataSetupSteps;
        private readonly LoginSteps _loginSteps;
        private readonly HearingDetailsSteps _hearingListSteps;
        private readonly EquipmentCheckSteps _equipmentCheckSteps;
        private readonly CameraMicrophoneSteps _cameraMicrophoneSteps;
        private readonly RulesSteps _rulesSteps;
        private readonly DeclarationSteps _declarationSteps;
        private readonly WaitingRoomSteps _waitingRoomSteps;
        private Page _currentPage = Page.Login;

        public CommonSteps(BrowserContext browserContext, CommonPages commonPages, 
            DataSetupSteps dataSetupSteps, LoginSteps loginSteps, HearingDetailsSteps hearingDetailsSteps,
            EquipmentCheckSteps equipmentCheckSteps, CameraMicrophoneSteps cameraMicrophoneSteps, RulesSteps rulesSteps,
            DeclarationSteps declarationSteps, WaitingRoomSteps waitingRoomSteps)
        {
            _browserContext = browserContext;
            _commonPages = commonPages;
            _dataSetupSteps = dataSetupSteps;
            _loginSteps = loginSteps;
            _hearingListSteps = hearingDetailsSteps;
            _equipmentCheckSteps = equipmentCheckSteps;
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
                case Journey.EquipmentCheck:
                case Journey.CameraAndMicrophone:
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
                default: throw new InvalidOperationException($"Current page was past the intended page: {currentPage}");
            }

            _currentPage = currentPage.NextPage(currentPage);
            _browserContext.Retry(() => _commonPages.PageUrl(_currentPage.Url));
        }

        [When(@"the user clicks the (.*) button")]
        public void WhentheUserClicksTheButton(string label)
        {
            _browserContext.NgDriver.WaitUntilElementVisible(CommonLocators.ButtonWithLabel(label)).Displayed
                .Should().BeTrue();
            _browserContext.NgDriver.WaitUntilElementVisible(CommonLocators.ButtonWithLabel(label)).Click();
        }

        [Then(@"contact us details are available")]
        public void ThenContactUsDetailsWillBeAvailable()
        {
            _browserContext.NgDriver.WaitUntilElementVisible(_commonPages.ContactUsLink).Displayed
                .Should().BeTrue();
            _commonPages.TheCaseNumberIsNotDisplayedInTheContactDetails().Should().BeTrue();
        }

        [Then(@"the user is on the (.*) page")]
        public void ThenTheUserIsOnThePage(string page)
        {
            switch (page)
            {
                case "Login": _browserContext.Retry(() => _commonPages.PageUrl(Page.Login)); break;
                case "Hearings List": _browserContext.Retry(() => _commonPages.PageUrl(Page.HearingList)); break;
                case "Equipment Check": _browserContext.Retry(() => _commonPages.PageUrl(Page.EquipmentCheck)); break;
                case "Camera and Microphone": _browserContext.Retry(() => _commonPages.PageUrl(Page.CameraAndMicrophone)); break;
                case "Rules": _browserContext.Retry(() => _commonPages.PageUrl(Page.Rules)); break;
                case "Declaration": _browserContext.Retry(() => _commonPages.PageUrl(Page.Declaration)); break;
                case "Waiting Room": _browserContext.Retry(() => _commonPages.PageUrl(Page.WaitingRoom)); break;
                default: throw new ArgumentOutOfRangeException(page);
            }
        }
    }
}

