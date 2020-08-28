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
        private int _applicantsCount;
        private int _respondantsCount;

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

        public GetHearingRow ApplicantsCount(int count)
        {
            _applicantsCount = count;
            return this;
        }

        public GetHearingRow RespondantsCount(int count)
        {
            _respondantsCount = count;
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

        private void GetApplicantParticipants()
        {
            if (_applicantsCount.Equals(1))
            {
                GetApplicantIndividual();
            }
            else
            {
                GetApplicantRepresentatives();
            }
        }

        private void GetRespondantParticipants()
        {
            if (_respondantsCount.Equals(1))
            {
                GetRespondentIndividual();
            }
            else
            {
                GetRespondentRepresentatives();
            }
        }

        private void GetApplicantIndividual()
        {
            _hearingRow.ApplicantIndividual = _browser.Driver.WaitUntilVisible(JudgeHearingListPage.ApplicantIndividualName(_hearingId)).Text;
        }

        private void GetApplicantRepresentatives()
        {

            _hearingRow.ApplicantRep = _browser.Driver.WaitUntilVisible(JudgeHearingListPage.ApplicantRepresentativeName(_hearingId)).Text;
            _hearingRow.ApplicantRepresentee = _browser.Driver.WaitUntilVisible(JudgeHearingListPage.ApplicantRepresenteeName(_hearingId)).Text;
        }

        private void GetRespondentIndividual()
        {
            _hearingRow.RespondentIndividual = _browser.Driver.WaitUntilVisible(JudgeHearingListPage.RespondentIndividualName(_hearingId)).Text;
        }

        private void GetRespondentRepresentatives()
        {
            _hearingRow.RespondentRep = _browser.Driver.WaitUntilVisible(JudgeHearingListPage.RespondentRepresentativeName(_hearingId)).Text;
            _hearingRow.RespondentRepresentee = _browser.Driver.WaitUntilVisible(JudgeHearingListPage.RespondentRepresenteeName(_hearingId)).Text;
        }

        private void GetParticipantCount()
        {
            _hearingRow.ParticipantCount = _browser.Driver.WaitUntilVisible(JudgeHearingListPage.ParticipantCount(_hearingId)).Text.Trim();
        }

        public HearingRow Fetch()
        {
            CheckRowIsVisible();
            GetTime();
            GetJudge();
            GetCaseDetails();
            GetParticipantCount();
            return _hearingRow;
        }
    }
}
