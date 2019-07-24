using System;
using System.Data;
using System.Linq;
using System.Net;
using FluentAssertions;
using TechTalk.SpecFlow;
using Testing.Common.Configuration;
using Testing.Common.Helpers;
using VideoWeb.AcceptanceTests.Assertions;
using VideoWeb.AcceptanceTests.Builders;
using VideoWeb.AcceptanceTests.Contexts;
using VideoWeb.Common.Helpers;
using VideoWeb.Services.Bookings;
using VideoWeb.Services.Video;
using ParticipantResponse = VideoWeb.Services.Bookings.ParticipantResponse;
using UpdateParticipantRequest = VideoWeb.Services.Bookings.UpdateParticipantRequest;
using UserRole = VideoWeb.Contract.Responses.UserRole;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public sealed class QueueSubscriberSteps
    {
        private readonly TestContext _context;
        private readonly HearingsEndpoints _hearingsEndpoints = new BookingsApiUriFactory().HearingsEndpoints;
        private readonly BookingsParticipantsEndpoints _bookingParticipantsEndpoints = new BookingsApiUriFactory().BookingsParticipantsEndpoints;
        private readonly ConferenceEndpoints _conferenceEndpoints = new VideoApiUriFactory().ConferenceEndpoints;
        private const string UpdatedWord = "Updated";
        private const int UpdatedTimeInMins = 1;
        private UserAccount _addedUser;
        private ParticipantResponse _updatedUser;
        private UpdateParticipantRequest _updatedRequest;
        private ParticipantResponse _deletedUser;

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
                .WithExpectedStatusCode(HttpStatusCode.OK)
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

        [When(@"I add a participant to the hearing")]
        public void WhenIAttemptToAddAParticipantToTheHearing()
        {
            _addedUser = _context.GetIndividualNotInHearing(_context.Hearing.Participants);
            var request = new ParticipantsRequestBuilder()
                .AddIndividual()
                .WithUser(_addedUser)
                .Build();

            _context.Request = _context.Post(_bookingParticipantsEndpoints.AddParticipantsToHearing(_context.NewHearingId), request);

            new ExecuteRequestBuilder()
                .WithContext(_context)
                .WithExpectedStatusCode(HttpStatusCode.NoContent)
                .SendToBookingsApi();
        }

        [When(@"I update a participant from the hearing")]
        public void WhenIUpdateAParticipantFromTheHearing()
        {
            _updatedUser = _context.Hearing.Participants.First();
            _updatedRequest = new UpdateParticipantBuilder()
                .ForParticipant(_updatedUser)
                .AddWordToStrings(UpdatedWord)
                .Build();

            if (_updatedUser.Id == null)
            {
                throw new DataException("Participant Id must be set");
            }

            _context.Request = _context.Put(_bookingParticipantsEndpoints.UpdateParticipantDetails(_context.NewHearingId, (Guid)_updatedUser.Id), _updatedRequest);

            new ExecuteRequestBuilder()
                .WithContext(_context)
                .WithExpectedStatusCode(HttpStatusCode.OK)
                .SendToBookingsApi();
        }

        [When(@"I remove a participant from the hearing")]
        public void WhenIRemoveAParticipantFromTheHearing()
        {
            _deletedUser = _context.Hearing.Participants.Find(x => x.User_role_name.Equals(UserRole.Individual.ToString()));
            if (_deletedUser.Id == null)
            {
                throw new DataException("User id must be set");
            }
            _context.Request = _context.Delete(_bookingParticipantsEndpoints.RemoveParticipantFromHearing(_context.NewHearingId, (Guid)_deletedUser.Id));

            new ExecuteRequestBuilder()
                .WithContext(_context)
                .WithExpectedStatusCode(HttpStatusCode.NoContent)
                .SendToBookingsApi();
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
            var conference = GetTheConferenceDetails();
            conference.Case_name.Should().Contain(UpdatedWord);
            conference.Case_number.Should().Contain(UpdatedWord);
            conference.Scheduled_date_time.Should()
                .Be(_context.Hearing.Scheduled_date_time?.AddMinutes(UpdatedTimeInMins));
            conference.Scheduled_duration.Should().Be(_context.Hearing.Scheduled_duration + UpdatedTimeInMins);
        }

        [Then(@"the conference has been deleted")]
        public void ThenTheConferenceHasBeenDeleted()
        {
            _context.Request = _context.Get(_conferenceEndpoints.GetConferenceDetailsById(_context.NewConferenceId));
            new ExecuteRequestBuilder()
                .WithContext(_context)
                .WithExpectedStatusCode(HttpStatusCode.NotFound)
                .SendToVideoApi();

            _context.NewHearingId = Guid.Empty;
            _context.NewConferenceId = Guid.Empty;
        }

        [Then(@"the participant has been added")]
        public void ThenTheParticipantHasBeenAdded()
        {
            var conference = GetTheConferenceDetails();
            var participants = conference.Participants;
            participants.Count.Should().Be(_context.Hearing.Participants.Count + 1);

            new AssertParticipantFromAccount().User(_addedUser).Matches(participants);
        }

        [Then(@"the participant has been updated")]
        public void ThenTheParticipantDetailsHaveBeenUpdated()
        {
            var conference = GetTheConferenceDetails();
            var updatedParticipant = conference.Participants.Find(x => x.Username.ToLower().Equals(_updatedUser.Username.ToLower()));
            updatedParticipant.Display_name.Should().Be(_updatedRequest.Display_name);
            updatedParticipant.Name.Should().Contain($"{_updatedRequest.Title}");
        }

        [Then(@"the participant has been removed")]
        public void ThenTheParticipantHasBeenRemoved()
        {
            var conference = GetTheConferenceDetails();
            conference.Participants.Any(x => x.Ref_id.Equals(_deletedUser.Id)).Should().BeFalse();
            conference.Participants.Count.Should().Be(_context.Hearing.Participants.Count - 1);
        }

        private ConferenceDetailsResponse GetTheConferenceDetails()
        {
            _context.Request = _context.Get(_conferenceEndpoints.GetConferenceDetailsById(_context.NewConferenceId));

            new ExecuteRequestBuilder()
                .WithContext(_context)
                .WithExpectedStatusCode(HttpStatusCode.OK)
                .SendToVideoApi();

            return ApiRequestHelper.DeserialiseSnakeCaseJsonToResponse<ConferenceDetailsResponse>(_context.Response.Content);
        }
    }
}

