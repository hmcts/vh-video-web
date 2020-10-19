using System;
using AcceptanceTests.Common.Driver.Drivers;
using AcceptanceTests.Common.Driver.Helpers;
using FluentAssertions;
using VideoWeb.AcceptanceTests.Pages;

namespace VideoWeb.AcceptanceTests.Helpers
{
    internal class GetHearingRow
    {
        private readonly HearingRow _hearingRow;
        private Guid _hearingId;
        private UserBrowser _browser;

        public GetHearingRow()
        {          
            _hearingRow = new HearingRow();           
        }

        public GetHearingRow WithConferenceId(Guid hearingId)
        {
            _hearingId = hearingId;
            return this;
        }

        public GetHearingRow WithDriver(UserBrowser browser)
        {
            _browser = browser;
            return this;
        }

        private void CheckRowIsVisible()
        {
            _browser.Driver.WaitUntilVisible(JudgeHearingListPage.CaseName(_hearingId)).Displayed.Should().BeTrue();
        }

        private void GetTime()
        {
            var unformattedText = _browser.Driver.WaitUntilVisible(JudgeHearingListPage.Time(_hearingId)).Text;
            var listOfTimes = unformattedText.Split("-");
            _hearingRow.StartTime = listOfTimes[0].Replace("-","").Trim();
            _hearingRow.EndTime = listOfTimes[1].Replace("-", "").Trim();
        }

        private void GetJudge()
        {
            _hearingRow.Judge = _browser.Driver.WaitUntilVisible(JudgeHearingListPage.Judge(_hearingId)).Text;
        }

        private void GetCaseDetails()
        {
            _hearingRow.CaseName = _browser.Driver.WaitUntilVisible(JudgeHearingListPage.CaseName(_hearingId)).Text;
            _hearingRow.CaseType = _browser.Driver.WaitUntilVisible(JudgeHearingListPage.CaseType(_hearingId)).Text;
            _hearingRow.CaseNumber = _browser.Driver.WaitUntilVisible(JudgeHearingListPage.CaseNumber(_hearingId)).Text;
        }

        private void GetParticipantCount()
        {
            _hearingRow.ParticipantCount = _browser.Driver.WaitUntilVisible(JudgeHearingListPage.ParticipantCount(_hearingId)).Text.Trim();
        }

        private void GetPanelMembersCount()
        {
            var elements = _browser.Driver.FindElements(JudgeHearingListPage.PanelMembersCount(_hearingId));
            _hearingRow.PanelMembersCount = elements.Count > 0 ? _browser.Driver.WaitUntilVisible(JudgeHearingListPage.PanelMembersCount(_hearingId)).Text.Trim() : "0";
        }

        private void GetObserversCount()
        {
            var elements = _browser.Driver.FindElements(JudgeHearingListPage.ObserversCount(_hearingId));
            _hearingRow.ObserversCount = elements.Count > 0 ? _browser.Driver.WaitUntilVisible(JudgeHearingListPage.ObserversCount(_hearingId)).Text.Trim() : "0";
        }

        private void GetWingersCount()
        {
            var elements = _browser.Driver.FindElements(JudgeHearingListPage.WingersCount(_hearingId));
            _hearingRow.WingersCount = elements.Count > 0 ? _browser.Driver.WaitUntilVisible(JudgeHearingListPage.WingersCount(_hearingId)).Text.Trim() : "0";
        }

        public HearingRow Fetch()
        {
            CheckRowIsVisible();
            GetTime();
            GetJudge();
            GetCaseDetails();
            GetParticipantCount();
            GetPanelMembersCount();
            GetObserversCount();
            GetWingersCount();
            return _hearingRow;
        }
    }
}
