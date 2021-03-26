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
            var unformattedText = _browser.TextOf(JudgeHearingListPage.Time(_hearingId));
            var listOfTimes = unformattedText.Split("-");
            _hearingRow.StartTime = listOfTimes[0].Replace("-","").Trim();
            _hearingRow.EndTime = listOfTimes[1].Replace("-", "").Trim();
        }

        private void GetJudge()
        {
            _hearingRow.Judge = _browser.TextOf(JudgeHearingListPage.Judge(_hearingId));
        }

        private void GetCaseDetails()
        {
            _hearingRow.CaseName = _browser.TextOf(JudgeHearingListPage.CaseName(_hearingId));
            _hearingRow.CaseType = _browser.TextOf(JudgeHearingListPage.CaseType(_hearingId));
            _hearingRow.CaseNumber = _browser.TextOf(JudgeHearingListPage.CaseNumber(_hearingId));
        }

        private void GetParticipantCount()
        {
            _hearingRow.ParticipantCount = _browser.TextOf(JudgeHearingListPage.ParticipantCount(_hearingId));
        }

        private void GetPanelMembersCount()
        {
            var elements = _browser.Driver.FindElements(JudgeHearingListPage.PanelMembersCount(_hearingId));
            _hearingRow.PanelMembersCount = elements.Count > 0 ? _browser.TextOf(JudgeHearingListPage.PanelMembersCount(_hearingId)) : "0";
        }

        private void GetObserversCount()
        {
            var elements = _browser.Driver.FindElements(JudgeHearingListPage.ObserversCount(_hearingId));
            _hearingRow.ObserversCount = elements.Count > 0 ? _browser.TextOf(JudgeHearingListPage.ObserversCount(_hearingId)) : "0";
        }

        private void GetWingersCount()
        {
            var elements = _browser.Driver.FindElements(JudgeHearingListPage.WingersCount(_hearingId));
            _hearingRow.WingersCount = elements.Count > 0 ? _browser.TextOf(JudgeHearingListPage.WingersCount(_hearingId)) : "0";
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
