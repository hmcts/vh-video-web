using System;
using System.Collections.Generic;
using System.Linq;
using FluentAssertions;
using Protractor;
using VideoWeb.AcceptanceTests.Pages;

namespace VideoWeb.AcceptanceTests.Helpers
{
    internal class GetHearingRow
    {
        private string _caseNumber;
        private string _judgeName;
        private readonly HearingRow _hearingRow;
        private readonly ClerkHearingListPage _page = new ClerkHearingListPage();
        private NgWebDriver _driver;

        public GetHearingRow()
        {          
            _hearingRow = new HearingRow();           
        }

        private void CheckRowIsVisisble()
        {
            _driver.WaitUntilElementVisible(_page.ClerkHearingCaseName(_caseNumber)).Displayed.Should().BeTrue();
        }

        private void GetTime()
        {
            var unformattedText = _driver.WaitUntilElementVisible(_page.ClerkHearingTime(_caseNumber)).Text;
            var listOfTimes = unformattedText.Split("-");
            _hearingRow.StartTime = listOfTimes[0].Replace("-","").Trim();
            _hearingRow.EndTime = listOfTimes[1].Replace("-", "").Trim();
        }

        private void GetJudge()
        {
            _hearingRow.Judge = _driver.WaitUntilElementVisible(_page.ClerkHearingJudge(_caseNumber, _judgeName)).Text;
        }

        private void GetHearingDetails()
        {
            _hearingRow.CaseName = _driver.WaitUntilElementVisible(_page.ClerkHearingCaseName(_caseNumber)).Text;
            _hearingRow.CaseType = _driver.WaitUntilElementVisible(_page.ClerkHearingCaseType(_caseNumber)).Text;
            _hearingRow.CaseNumber = _caseNumber;
        }

        private void GetParticipants()
        {
            _hearingRow.Parties = new List<PartiesDetails>();
            var repElements = _driver.WaitUntilElementsVisible(_page.ClerkHearingRepresentatives(_caseNumber));
            var indElements = _driver.WaitUntilElementsVisible(_page.ClerkHearingIndividuals(_caseNumber));
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

        public GetHearingRow WithDriver(NgWebDriver driver)
        {
            _driver = driver;
            return this;
        }

        public HearingRow Fetch()
        {
            if (_caseNumber == null || _judgeName == null || _driver == null)
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
