using System;
using System.Net;
using System.Threading;
using FluentAssertions;
using TechTalk.SpecFlow;
using Testing.Common.Helpers;
using VideoWeb.AcceptanceTests.Assertions;
using VideoWeb.AcceptanceTests.Builders;
using VideoWeb.AcceptanceTests.Contexts;
using VideoWeb.Common.Helpers;
using VideoWeb.Contract.Responses;
using VideoWeb.Services.Bookings;
using VideoWeb.Services.Video;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public sealed class QueueSubscriberSteps
    {
        private readonly TestContext _context;
        private readonly HearingsEndpoints _hearingsEndpoints = new BookingsApiUriFactory().HearingsEndpoints;
        private readonly ConferenceEndpoints _conferenceEndpoints = new VideoApiUriFactory().ConferenceEndpoints;
        private const string UpdatedWord = "Updated";
        private const int UpdatedTimeInMins = 1;

        public QueueSubscriberSteps(TestContext context)
        {
            _context = context;
        }

        [When(@"I attempt to update the hearing details")]
        public void WhenIAttemptToUpdateTheHearingDetails()
        {         
            var request = new UpdateHearingRequestBuilder()           
                .ForHearing(_context.Hearing)
                .AddWordToStrings(UpdatedWord)
                .AddMinutesToTimes(UpdatedTimeInMins)
                .ChangeVenue()
                .UpdatedBy(_context.GetCaseAdminUser().Username)
                .Build();

            _context.Request = _context.Put(_hearingsEndpoints.UpdateHearingDetails(_context.NewHearingId), request);

            new ExecuteRequestBuilder()
                .WithContext(_context)
                .SendToBookingsApi();
        }

        [When(@"I attempt to cancel the hearing")]
        public void WhenIAttemptToCancelTheHearing()
        {
            var request = new UpdateBookingStatusRequest()
            {
                Updated_by = _context.GetCaseAdminUser().Username,
                Status = UpdateBookingStatusRequestStatus.Cancelled
            };
            _context.Request = _context.Patch(_hearingsEndpoints.UpdateHearingDetails(_context.NewHearingId), request);

            new ExecuteRequestBuilder()
                .WithContext(_context)
                .WithExpectedStatusCode(HttpStatusCode.NoContent)
                .SendToBookingsApi();
        }

        [When(@"I attempt to delete the hearing")]
        public void WhenIAttemptToDeleteTheHearing()
        {
            _context.Request = _context.Delete(_hearingsEndpoints.RemoveHearing(_context.NewHearingId));

            new ExecuteRequestBuilder()
                .WithContext(_context)
                .WithExpectedStatusCode(HttpStatusCode.NoContent)
                .SendToBookingsApi();
        }

        [When(@"I (.*) a participant from the hearing")]
        public void WhenIAttemptToAddAParticipantToTheHearing(string action)
        {
            ScenarioContext.Current.Pending();
        }

        [Then(@"the conference has been created from the booking")]
        public void ThenTheConferenceHasBeenCreatedFromTheBooking()
        {
            _context.Conference.Current_status.Should().Be(ConferenceState.NotStarted);
            new AssertConference(_context.Conference).MatchesHearing(_context.Hearing);
        }      

        [Then(@"the conference details have been updated")]
        public void ThenTheConferenceDetailsHaveBeenUpdated()
        {
            GetTheConferenceDetails();

            var conference = ApiRequestHelper.DeserialiseSnakeCaseJsonToResponse<ConferenceDetailsResponse>(_context.Response.Content);
            conference.Case_name.Should().Contain(UpdatedWord);
            conference.Case_number.Should().Contain(UpdatedWord);
            conference.Scheduled_date_time.Should()
                .Be(_context.Hearing.Scheduled_date_time?.AddMinutes(UpdatedTimeInMins));
            conference.Scheduled_duration.Should().Be(_context.Hearing.Scheduled_duration + UpdatedTimeInMins);
        }

        [Then(@"the conference has been cancelled")]
        public void ThenTheConferenceHasBeenCancelled()
        {
            Thread.Sleep(TimeSpan.FromSeconds(30));
            GetTheConferenceDetails();

            var model = ApiRequestHelper.DeserialiseSnakeCaseJsonToResponse<ConferenceDetailsResponse>(_context.Response.Content);
            model.Current_status.Should().Be(ConferenceStatus.Closed);
            model.Closed_date_time.Should().NotBeNull();
        }

        private void GetTheConferenceDetails()
        {
            _context.Request = _context.Get(_conferenceEndpoints.GetConferenceDetailsById(_context.NewConferenceId));

            new ExecuteRequestBuilder()
                .WithContext(_context)
                .SendAndVerifyTheResponseIs(HttpStatusCode.OK);
        }

        [Then(@"the conference has been deleted")]
        public void ThenTheConferenceHasBeenDeleted()
        {
            Thread.Sleep(TimeSpan.FromSeconds(5));

            _context.Request = _context.Get(_conferenceEndpoints.GetConferenceDetailsById(_context.NewConferenceId));
            new ExecuteRequestBuilder()
                .WithContext(_context)
                .SendAndVerifyTheResponseIs(HttpStatusCode.NotFound);
        }

        [Then(@"the participant details have been updated")]
        public void ThenTheParticipantDetailsHaveBeenUpdated()
        {
            ScenarioContext.Current.Pending();
        }
    }
}
