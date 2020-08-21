using System.Collections.Generic;
using System.Linq;
using System.Net;
using AcceptanceTests.Common.Api.Helpers;
using FluentAssertions;
using TechTalk.SpecFlow;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.Services.Bookings;
using VideoWeb.Services.Video;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public class TestHelpersSteps
    {
        private readonly TestContext _c;
        public TestHelpersSteps(TestContext c)
        {
            _c = c;
        }

        [Given(@"I remove all hearings with the judge '(.*)'")]
        public void GivenIRemoveAllHearingsWithTheJudge(string judgeUsername)
        {
            judgeUsername.Should().Contain("@");
            judgeUsername.ToLower().Should().ContainAny("automation", "manual", "performance", "test");
            var response = _c.Apis.BookingsApi.GetHearingsForUsername(judgeUsername);
            var hearings = RequestHelper.Deserialise<List<HearingDetailsResponse>>(response.Content);
            if (hearings == null) return;
            foreach (var hearing in hearings)
            {
                _c.Apis.BookingsApi.DeleteHearing(hearing.Id);
            }
        }

        [Given(@"I remove all hearings with partial case name '(.*)'")]
        [Given(@"I remove all hearings with partial case number '(.*)'")]
        public void GivenIRemoveAllHearingsWithPartialCaseName(string partialCaseNameOrNumber)
        {
            partialCaseNameOrNumber.Should().NotBeNullOrWhiteSpace();
            partialCaseNameOrNumber.Should().NotBeEmpty();
            partialCaseNameOrNumber.ToLower().Should().ContainAny("automation", "manual", "performance", "test");
            const int limit = 1000;
            RemoveWithCaseNameOrNumber(partialCaseNameOrNumber, limit);
        }

        private void RemoveWithCaseNameOrNumber(string partialString, int limit)
        {
            var response = _c.Apis.BookingsApi.GetHearingsByAnyCaseType(limit);
            var bookings = RequestHelper.Deserialise<BookingsResponse>(response.Content);
            var hearings = GetListOfAllHearings(bookings);
            foreach (var hearing in hearings)
            {
                if (hearing.Hearing_name.ToLower().Contains(partialString.ToLower()) ||
                    hearing.Hearing_number.ToLower().Contains(partialString.ToLower()))
                {
                    _c.Apis.BookingsApi.DeleteHearing(hearing.Hearing_id);
                }
            }
        }

        private static IEnumerable<BookingsHearingResponse> GetListOfAllHearings(BookingsResponse bookings)
        {
            var hearings = new List<BookingsHearingResponse>();

            foreach (var bookedHearing in bookings.Hearings)
            {
                hearings.AddRange(bookedHearing.Hearings);
            }

            return hearings;
        }

        [Given(@"I remove all conferences for today containing the case name '(.*)'")]
        public void GivenIRemoveAllConferencesContainingTheCaseName(string caseName)
        {
            caseName.Should().NotBeNullOrEmpty();
            caseName.Should().NotBeNullOrWhiteSpace();
            caseName.ToLower().Should().Contain("test");
            var response = _c.Apis.VideoApi.GetConferencesForTodayVho();
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            var conferences = RequestHelper.Deserialise<List<ConferenceForAdminResponse>>(response.Content);
            foreach (var deleteConference in from conference in conferences where conference.Case_name.ToLower().Contains(caseName.ToLower()) select _c.Apis.VideoApi.DeleteConference(conference.Id))
            {
                deleteConference.StatusCode.Should().Be(HttpStatusCode.NoContent);
            }
        }
    }
}
