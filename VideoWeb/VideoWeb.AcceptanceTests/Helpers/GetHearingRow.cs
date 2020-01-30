using System;
using System.Collections.Generic;
using System.Linq;
using AcceptanceTests.Common.Driver.Browser;
using AcceptanceTests.Common.Driver.Helpers;
using FluentAssertions;
using VideoWeb.AcceptanceTests.Pages;

namespace VideoWeb.AcceptanceTests.Helpers
{
    internal class GetHearingRow
    {
        private string _caseNumber;
        private string _judgeName;
        private readonly HearingRow _hearingRow;
        private UserBrowser _browser;

        public GetHearingRow()
        {          
            _hearingRow = new HearingRow();           
        }

        private void CheckRowIsVisible()
        {
            _browser.Driver.WaitUntilVisible(ClerkHearingListPage.ClerkHearingCaseName(_caseNumber)).Displayed.Should().BeTrue();
        }

        private void GetTime()
        {
            var unformattedText = _browser.Driver.WaitUntilVisible(ClerkHearingListPage.ClerkHearingTime(_caseNumber)).Text;
            var listOfTimes = unformattedText.Split("-");
            _hearingRow.StartTime = listOfTimes[0].Replace("-","").Trim();
            _hearingRow.EndTime = listOfTimes[1].Replace("-", "").Trim();
        }

        private void GetJudge()
        {
            _hearingRow.Judge = _browser.Driver.WaitUntilVisible(ClerkHearingListPage.ClerkHearingJudge(_caseNumber, _judgeName)).Text;
        }

        private void GetCaseDetails()
        {
            _hearingRow.CaseName = _browser.Driver.WaitUntilVisible(ClerkHearingListPage.ClerkHearingCaseName(_caseNumber)).Text;
            _hearingRow.CaseType = _browser.Driver.WaitUntilVisible(ClerkHearingListPage.ClerkHearingCaseType(_caseNumber)).Text;
            _hearingRow.CaseNumber = _caseNumber;
        }

        private void GetParticipants()
        {
            _hearingRow.Parties = new List<PartiesDetails>();
            var repElements = _browser.Driver.WaitUntilElementsVisible(ClerkHearingListPage.ClerkHearingRepresentatives(_caseNumber));
            var indElements = _browser.Driver.WaitUntilElementsVisible(ClerkHearingListPage.ClerkHearingIndividuals(_caseNumber));
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

        public GetHearingRow WithDriver(UserBrowser browser)
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

            CheckRowIsVisible();
            GetTime();
            GetJudge();
            GetCaseDetails();
            GetParticipants();

            return _hearingRow;
        }
    }
}
