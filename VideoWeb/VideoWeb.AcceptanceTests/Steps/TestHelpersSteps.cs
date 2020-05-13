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
            var hearings = RequestHelper.DeserialiseSnakeCaseJsonToResponse<List<HearingDetailsResponse>>(response.Content);
            if (hearings == null) return;
            foreach (var hearing in hearings)
            {
                _c.Apis.BookingsApi.DeleteHearing(hearing.Id);
            }
        }

        [Given(@"I remove all hearings with partial case name '(.*)'")]
        public void GivenIRemoveAllHearingsWithPartialCaseName(string partialCaseName)
        {
            partialCaseName.Should().NotBeNullOrWhiteSpace();
            partialCaseName.ToLower().Should().ContainAny("automation", "manual", "performance", "test");
            const int limit = 10;
            var response = _c.Apis.BookingsApi.GetHearingsByAnyCaseType(limit);
            var bookings = RequestHelper.DeserialiseSnakeCaseJsonToResponse<BookingsResponse>(response.Content);
            var hearings = GetListOfAllHearings(bookings);
            foreach (var hearing in hearings)
            {
                if (hearing.Hearing_name.ToLower().Contains(partialCaseName.ToLower()))
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
            var conferences = RequestHelper.DeserialiseSnakeCaseJsonToResponse<List<ConferenceForAdminResponse>>(response.Content);
            foreach (var deleteConference in from conference in conferences where conference.Case_name.ToLower().Contains(caseName.ToLower()) select _c.Apis.VideoApi.DeleteConference(conference.Id))
            {
                deleteConference.StatusCode.Should().Be(HttpStatusCode.NoContent);
            }
        }
    }
}
