using System;
using System.Linq;
using System.Net;
using AcceptanceTests.Common.Api.Hearings;
using AcceptanceTests.Common.Api.Helpers;
using AcceptanceTests.Common.Configuration.Users;
using FluentAssertions;
using NUnit.Framework;
using TechTalk.SpecFlow;
using VideoWeb.AcceptanceTests.Assertions;
using VideoWeb.AcceptanceTests.Builders;
using VideoWeb.Services.Bookings;
using VideoWeb.Services.Video;
using EventType = VideoWeb.EventHub.Enums.EventType;
using RoomType = VideoWeb.EventHub.Enums.RoomType;
using TestContext = VideoWeb.AcceptanceTests.Helpers.TestContext;

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

        [Given(@"I have a hearing only without a conference")]
        public void GivenIHaveAHearingOnly()
        {
            GivenIHaveAHearing();
        }

        [Given(@"I have a hearing")]
        [Given(@"I have another hearing")]
        public void GivenIHaveAHearingAndAConference()
        {
            GivenIHaveAHearing();
            GetTheNewConferenceDetails();
        }

        [Given(@"I have a hearing in (.*) minutes time")]
        [Given(@"I have another hearing in (.*) minutes time")]
        public void GivenIHaveAHearingAndAConferenceInMinutesTime(int minutes)
        {
            CheckThatTheHearingWillBeCreatedForToday(_c.TimeZone.AdjustForVideoWeb(DateTime.Now.ToUniversalTime().AddMinutes(minutes)));
            GivenIHaveAHearing(minutes);
            GetTheNewConferenceDetails();
            _c.Test.DelayedStartTime = minutes;
        }

        [Given(@"I have a hearing in (.*) days time")]
        [Given(@"I have another hearing in (.*) days time")]
        public void GivenIHaveAHearingAndAConferenceInDaysTime(int days)
        {
            var minutesFromDays = Convert.ToInt32(TimeSpan.FromDays(days).TotalMinutes);
            GivenIHaveAHearing(minutesFromDays);
            GetTheNewConferenceDetails();
        }

        [Given(@"I have a hearing located in (.*)")]
        [Given(@"I have another hearing located in (.*)")]
        public void GivenIHaveAHearingInLocation(string location)
        {
            GivenIHaveAHearing(30, location);
            GetTheNewConferenceDetails();
        }

        public void GivenIHaveAHearing(int minutes = 0, string location = "Birmingham Civil and Family Justice Centre")
        {
            var request = new HearingRequestBuilder()
                .WithUserAccounts(_c.UserAccounts)
                .WithScheduledTime(_c.TimeZone.AdjustForVideoWeb(DateTime.Now.ToUniversalTime().AddMinutes(minutes)))
                .WithScheduledDuration(HearingDuration)
                .WithLocation(location)
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

        private void CheckThatTheHearingWillBeCreatedForToday(DateTime dateTime)
        {
            if (!_c.TimeZone.AdjustForVideoWeb(DateTime.Now).Day.Equals(dateTime.Day))
                Assert.Ignore($"Ignoring the test as the hearing will be created for tomorrow, and won't be visible in the UI.");
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
            _c.Test.Conferences.Add(conference);
            _c.Test.NewConferenceId = conference.Id;
            _c.Test.ConferenceParticipants = conference.Participants;
        }

        [Given(@"the hearing was closed more than 30 minutes ago")]
        public void GivenTheHearingWasClosedMoreThanMinutesAgo()
        {
            var id = _c.Test.ConferenceParticipants.Find(x => x.User_role.Equals(UserRole.Judge)).Id;
            var request = new CallbackEventRequestBuilder()
                .WithConferenceId(_c.Test.NewConferenceId)
                .WithParticipantId(id)
                .WithEventType(EventType.Close)
                .FromRoomType(RoomType.HearingRoom)
                .WithTimestamp(_c.TimeZone.AdjustForVideoWeb(DateTime.Now.AddMinutes(-31)))
                .Build();

            var response = _c.Apis.VideoWebApi.SendCallBackEvent(request);
            response.StatusCode.Should().Be(HttpStatusCode.NoContent);
        }
    }
}
