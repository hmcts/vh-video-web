﻿using System;
using System.Collections.Generic;
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
using VideoWeb.Services.Bookings;
using VideoWeb.Services.Video;
using ParticipantRequest = VideoWeb.Services.Bookings.ParticipantRequest;
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

            var list = new AddParticipantsToHearingRequest() {Participants = new List<ParticipantRequest>() {request}};

            _context.Request = _context.Post(_bookingParticipantsEndpoints.AddParticipantsToHearing(_context.NewHearingId), list);

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
            new ConferenceDetailsResponseBuilder(_context).PollForUpdatedHearing(UpdatedWord);

            var conference = new ConferenceDetailsResponseBuilder(_context).GetConferenceDetails();
            conference.Case_name.Should().Contain(UpdatedWord);
            conference.Case_number.Should().Contain(UpdatedWord);
            conference.Scheduled_date_time.Should()
                .Be(_context.Hearing.Scheduled_date_time?.AddMinutes(UpdatedTimeInMins));
            conference.Scheduled_duration.Should().Be(_context.Hearing.Scheduled_duration + UpdatedTimeInMins);
        }

        [Then(@"the conference has been deleted")]
        public void ThenTheConferenceHasBeenDeleted()
        {
            new ConferenceDetailsResponseBuilder(_context).PollForExpectedStatus(HttpStatusCode.NotFound).Should().BeTrue();

            _context.NewHearingId = Guid.Empty;
            _context.NewConferenceId = Guid.Empty;
        }

        [Then(@"the participant has been added")]
        public void ThenTheParticipantHasBeenAdded()
        {
            new ConferenceDetailsResponseBuilder(_context)
                .IsAdded()
                .WithUsername(_addedUser.Username)
                .PollForParticipant()
                .Should().BeTrue("Participant found");

            var conference = new ConferenceDetailsResponseBuilder(_context).GetConferenceDetails();
            var participants = conference.Participants;
            participants.Count.Should().Be(_context.Hearing.Participants.Count + 1);

            new AssertParticipantFromAccount().User(_addedUser).Matches(participants);
        }

        [Then(@"the participant has been updated")]
        public void ThenTheParticipantDetailsHaveBeenUpdated()
        {
            new ConferenceDetailsResponseBuilder(_context)
                .IsAdded()
                .WithUsername(_updatedUser.Username)
                .ExpectedUpdate(_updatedRequest)
                .PollForParticipantUpdated()
                .Should().BeTrue("Updated participant found");
        }

        [Then(@"the participant has been removed")]
        public void ThenTheParticipantHasBeenRemoved()
        {
            new ConferenceDetailsResponseBuilder(_context)
                .IsRemoved()
                .WithUsername(_deletedUser.Username)
                .PollForParticipant()
                .Should().BeTrue("Participant deleted");

            var conference = new ConferenceDetailsResponseBuilder(_context).GetConferenceDetails();
            conference.Participants.Any(x => x.Ref_id.Equals(_deletedUser.Id)).Should().BeFalse();
            conference.Participants.Count.Should().Be(_context.Hearing.Participants.Count - 1);
        }

        [AfterScenario("UpdateParticipant")]
        public static void ResetUpdatedParticipant(TestContext context, BookingsParticipantsEndpoints endpoints)
        {
            var updatedUser = context.Hearing.Participants.First();
            var updatedRequest = new UpdateParticipantBuilder()
                .ForParticipant(updatedUser)
                .AddWordToStrings(UpdatedWord)
                .Reset();

            if (updatedUser.Id == null)
            {
                throw new DataException("Participant Id must be set");
            }

            context.Request = context.Put(endpoints.UpdateParticipantDetails(context.NewHearingId, (Guid)updatedUser.Id), updatedRequest);

            new ExecuteRequestBuilder()
                .WithContext(context)
                .WithExpectedStatusCode(HttpStatusCode.OK)
                .SendToBookingsApi();
        }        
    }
}

