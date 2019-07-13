using System;
using System.Collections.Generic;
using System.Linq;
using FluentAssertions;
using OpenQA.Selenium.Support.Extensions;
using VideoWeb.AcceptanceTests.Contexts;
using VideoWeb.AcceptanceTests.Pages;

namespace VideoWeb.AcceptanceTests.Helpers
{
    internal class GetHearingRow
    {
        private string _caseNumber;
        private string _judgeName;
        private readonly HearingRow _hearingRow;
        private readonly ClerkHearingListPage _page = new ClerkHearingListPage();
        private BrowserContext _browser;

        public GetHearingRow()
        {          
            _hearingRow = new HearingRow();           
        }

        private void CheckRowIsVisisble()
        {
            _browser.NgDriver.WaitUntilElementVisible(_page.ClerkHearingCaseName(_caseNumber)).Displayed.Should().BeTrue();
            _browser.NgDriver.ExecuteJavaScript("arguments[0].scrollIntoView(true);", _browser.NgDriver.FindElement(_page.ClerkHearingCaseName(_caseNumber)));
        }

        private void GetTime()
        {
            var unformattedText = _browser.NgDriver.WaitUntilElementVisible(_page.ClerkHearingTime(_caseNumber)).Text;
            var listOfTimes = unformattedText.Split("-");
            _hearingRow.StartTime = listOfTimes[0].Replace("-","").Trim();
            _hearingRow.EndTime = listOfTimes[1].Replace("-", "").Trim();
        }

        private void GetJudge()
        {
            _hearingRow.Judge = _browser.NgDriver.WaitUntilElementVisible(_page.ClerkHearingJudge(_caseNumber, _judgeName)).Text;
        }

        private void GetHearingDetails()
        {
            _hearingRow.CaseName = _browser.NgDriver.WaitUntilElementVisible(_page.ClerkHearingCaseName(_caseNumber)).Text;
            _hearingRow.CaseType = _browser.NgDriver.WaitUntilElementVisible(_page.ClerkHearingCaseType(_caseNumber)).Text;
            _hearingRow.CaseNumber = _caseNumber;
        }

        private void GetParticipants()
        {
            _hearingRow.Parties = new List<PartiesDetails>();
            var repElements = _browser.NgDriver.WaitUntilElementsVisible(_page.ClerkHearingRepresentatives(_caseNumber));
            var indElements = _browser.NgDriver.WaitUntilElementsVisible(_page.ClerkHearingIndividuals(_caseNumber));
            var participants = repElements.Select(element => new PartiesDetails {RepresentativeName = element.Text}).ToList();

            for (var i = 0; i < participants.Count; i++)
            {
                participants[i].IndividualName = indElements[i].Text;
            }

            _hearingRow.Parties = participants;
        }

        public GetHearingRow ForJudge(string judgeName)
        {
            _judgeName = judgeName;
            return this;
        }

        public GetHearingRow ForCaseNumber(string caseNumber)
        {
            _caseNumber = caseNumber;
            return this;
        }

        public GetHearingRow WithBrowser(BrowserContext browser)
        {
            _browser = browser;
            return this;
        }

        public HearingRow Fetch()
        {
            if (_caseNumber == null || _judgeName == null || _browser == null)
            {
                throw new NullReferenceException("Values must be set");
            }

            CheckRowIsVisisble();
            GetTime();
            GetJudge();
            GetHearingDetails();
            GetParticipants();

            return _hearingRow;
        }
    }
}
