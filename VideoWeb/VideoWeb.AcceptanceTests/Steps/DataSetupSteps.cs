using System;
using System.Linq;
using System.Net;
using AcceptanceTests.Common.Api.Hearings;
using AcceptanceTests.Common.Api.Requests;
using AcceptanceTests.Common.Configuration.Users;
using FluentAssertions;
using TechTalk.SpecFlow;
using VideoWeb.AcceptanceTests.Assertions;
using VideoWeb.AcceptanceTests.Builders;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.Services.Bookings;
using VideoWeb.Services.Video;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public sealed class DataSetupSteps
    {
        private readonly TestContext _c;
        private const int HearingDuration = 60;

        public DataSetupSteps(TestContext c)
        {
            _c = c;
        }

        [Given(@"I have a hearing")]
        public void GivenIHaveAHearingOnly()
        {
            GivenIHaveAHearing();
        }

        [Given(@"I have a hearing and a conference")]
        [Given(@"I have another hearing and a conference")]
        public void GivenIHaveAHearingAndAConference()
        {
            GivenIHaveAHearing();
            GetTheNewConferenceDetails();
        }

        [Given(@"I have a hearing and a conference in (.*) minutes time")]
        public void GivenIHaveAHearingAndAConferenceInMinutesTime(int minutes)
        {
            GivenIHaveAHearing(minutes);
            GetTheNewConferenceDetails();
            _c.Test.DelayedStartTime = minutes;
        }

        [Given(@"I have a hearing and a conference in (.*) days time")]
        [Given(@"I have another hearing and a conference in (.*) days time")]
        public void GivenIHaveAHearingAndAConferenceInDaysTime(int days)
        {
            var minutesFromDays = Convert.ToInt32(TimeSpan.FromDays(days).TotalMinutes);
            GivenIHaveAHearing(minutesFromDays);
            GetTheNewConferenceDetails();
        }

        public void GivenIHaveAHearing(int minutes = 0)
        {
            var request = new HearingRequestBuilder()
                .WithUserAccounts(_c.UserAccounts)
                .WithScheduledTime(DateTime.Now.ToUniversalTime().AddMinutes(minutes))
                .WithScheduledDuration(HearingDuration)
                .Build();

            var hearingResponse = _c.Apis.BookingsApi.CreateHearing(request);
            hearingResponse.StatusCode.Should().Be(HttpStatusCode.Created);
            var hearing = RequestHelper.DeserialiseSnakeCaseJsonToResponse<HearingDetailsResponse>(hearingResponse.Content);
            hearing.Should().NotBeNull();
            _c.Test.Hearing = hearing;
            _c.Test.NewHearingId = hearing.Id;
            _c.Test.Case = hearing.Cases.First();
            _c.Test.HearingParticipants = hearing.Participants;
        }

        [Given(@"Get the new conference details")]
        [When(@"I attempt to retrieve the new conference details from the video api")]
        public void GetTheNewConferenceDetails()
        {
            var updateRequest = new UpdateBookingStatusRequest
            {
                Status = UpdateBookingStatus.Created,
                Updated_by = UserManager.GetCaseAdminUser(_c.UserAccounts).Username
            };

            var response = _c.Apis.BookingsApi.ConfirmHearingToCreateConference(_c.Test.NewHearingId, updateRequest);
            response.StatusCode.Should().Be(HttpStatusCode.NoContent);
            var videoApiManager = new VideoApiManager(_c.VideoWebConfig.VhServices.VideoApiUrl, _c.Tokens.VideoApiBearerToken);
            response = videoApiManager.PollForConferenceResponse(_c.Test.NewHearingId);
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            var conference = RequestHelper.DeserialiseSnakeCaseJsonToResponse<ConferenceDetailsResponse>(response.Content);
            AssertConferenceDetailsResponse.ForConference(conference);
            _c.Test.Conference = conference;
            _c.Test.NewConferenceId = conference.Id;
            _c.Test.ConferenceParticipants = conference.Participants;
        }
    }
}
