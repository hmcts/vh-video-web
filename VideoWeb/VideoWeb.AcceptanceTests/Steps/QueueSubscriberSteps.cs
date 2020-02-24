using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using AcceptanceTests.Common.Api.Hearings;
using AcceptanceTests.Common.Api.Requests;
using AcceptanceTests.Common.Configuration.Users;
using FluentAssertions;
using TechTalk.SpecFlow;
using VideoWeb.AcceptanceTests.Api;
using VideoWeb.AcceptanceTests.Assertions;
using VideoWeb.AcceptanceTests.Builders;
using VideoWeb.Services.Bookings;
using VideoWeb.Services.Video;
using ParticipantRequest = VideoWeb.Services.Bookings.ParticipantRequest;
using ParticipantResponse = VideoWeb.Services.Bookings.ParticipantResponse;
using TestContext = VideoWeb.AcceptanceTests.Helpers.TestContext;
using UpdateParticipantRequest = VideoWeb.Services.Bookings.UpdateParticipantRequest;
using UserRole = VideoWeb.Contract.Responses.UserRole;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public sealed class QueueSubscriberSteps
    {
        private readonly TestContext _c;
        private UserAccount _addedUser;
        private ParticipantResponse _updatedUser;
        private UpdateParticipantRequest _updatedRequest;
        private ParticipantResponse _deletedUser;

        public QueueSubscriberSteps(TestContext c)
        {
            _c = c;
        }

        [When(@"I attempt to update the hearing details")]
        public void WhenIAttemptToUpdateTheHearingDetails()
        {         
            var request = new UpdateHearingRequestBuilder()           
                .ForHearing(_c.Test.Hearing)
                .AddWordToStrings(_c.Test.TestData.UpdatedWord)
                .AddMinutesToTimes(_c.Test.TestData.UpdatedTimeInMinutes)
                .ChangeVenue()
                .UpdatedBy(UserManager.GetCaseAdminUser(_c.UserAccounts).Username)
                .Build();

            var response = _c.Apis.BookingsApi.UpdateHearing(_c.Test.NewHearingId, request);
            response.StatusCode.Should().Be(HttpStatusCode.OK);
        }

        [When(@"I attempt to cancel the hearing")]
        public void WhenIAttemptToCancelTheHearing()
        {
            var request = new UpdateBookingStatusRequest()
            {
                Updated_by = UserManager.GetCaseAdminUser(_c.UserAccounts).Username,
                Status = UpdateBookingStatus.Cancelled
            };

            var response = _c.Apis.BookingsApi.UpdateHearingDetails(_c.Test.NewHearingId, request);
            response.StatusCode.Should().Be(HttpStatusCode.NoContent);
        }

        [When(@"I attempt to delete the hearing")]
        public void WhenIAttemptToDeleteTheHearing()
        {
            var response = _c.Apis.BookingsApi.DeleteHearing(_c.Test.NewHearingId);
            response.StatusCode.Should().Be(HttpStatusCode.NoContent);
        }

        [When(@"I add a participant to the hearing")]
        public void WhenIAttemptToAddAParticipantToTheHearing()
        {
            var participants = (from participant in _c.Test.HearingParticipants where participant.User_role_name.ToLower().Equals("individual") select participant.Last_name).ToList();
            _addedUser = UserManager.GetIndividualNotInHearing(_c.UserAccounts, participants);
            var request = new ParticipantsRequestBuilder().AddIndividual().WithUser(_addedUser).Build();
            var list = new AddParticipantsToHearingRequest() {Participants = new List<ParticipantRequest>() {request}};
            var response = _c.Apis.BookingsApi.AddParticipantsToHearing(_c.Test.NewHearingId, list);
            response.StatusCode.Should().Be(HttpStatusCode.NoContent);
        }

        [When(@"I update a participant from the hearing")]
        public void WhenIUpdateAParticipantFromTheHearing()
        {
            _updatedUser = _c.Test.HearingParticipants.First();
            _updatedRequest = new UpdateParticipantBuilder()
                .ForParticipant(_updatedUser)
                .AddWordToStrings(_c.Test.TestData.UpdatedWord)
                .Build();

            var response = _c.Apis.BookingsApi.UpdateParticipantDetails(_c.Test.NewHearingId, _updatedUser.Id, _updatedRequest);
            response.StatusCode.Should().Be(HttpStatusCode.OK);
        }

        [When(@"I remove a participant from the hearing")]
        public void WhenIRemoveAParticipantFromTheHearing()
        {
            _deletedUser = _c.Test.HearingParticipants.Find(x => x.User_role_name.Equals(UserRole.Individual.ToString()));
            var response =  _c.Apis.BookingsApi.RemoveParticipant(_c.Test.NewHearingId, _deletedUser.Id);
            response.StatusCode.Should().Be(HttpStatusCode.NoContent);
        }

        [Then(@"the conference has been created from the booking")]
        public void ThenTheConferenceHasBeenCreatedFromTheBooking()
        {
            _c.Test.Conference.Current_status.Should().Be(ConferenceState.NotStarted);
            new AssertConference(_c.Test.Conference).MatchesHearing(_c.Test.Hearing);
        }      

        [Then(@"the conference details have been updated")]
        public void ThenTheConferenceDetailsHaveBeenUpdated()
        {
            var conference = new PollForUpdatedConference(_c.Apis.VideoApi).WithConferenceId(_c.Test.NewConferenceId)
                .WithUpdatedWord(_c.Test.TestData.UpdatedWord).Poll();
            conference.Case_name.Should().Contain(_c.Test.TestData.UpdatedWord);
            conference.Case_number.Should().Contain(_c.Test.TestData.UpdatedWord);
            conference.Scheduled_date_time.Should().Be(_c.Test.Hearing.Scheduled_date_time.AddMinutes(_c.Test.TestData.UpdatedTimeInMinutes));
            conference.Scheduled_duration.Should().Be(_c.Test.Hearing.Scheduled_duration + _c.Test.TestData.UpdatedTimeInMinutes);
        }

        [Then(@"the conference has been deleted")]
        public void ThenTheConferenceHasBeenDeleted()
        {
            _c.Apis.VideoApi.PollForConferenceDeleted(_c.Test.NewHearingId).Should().BeTrue();
            _c.Test.NewHearingId = Guid.Empty;
            _c.Test.NewConferenceId = Guid.Empty;
        }

        [Then(@"the participant has been added")]
        public void ThenTheParticipantHasBeenAdded()
        {
            new PollForParticipant(_c.Apis.VideoApi)
                .IsAdded()
                .WithConferenceId(_c.Test.NewConferenceId)
                .WithParticipant(_addedUser.Username)
                .Poll()
                .Should().BeTrue("Participant added");

            var response = _c.Apis.VideoApi.GetConferenceByConferenceId(_c.Test.NewConferenceId);
            var conference =  RequestHelper.DeserialiseSnakeCaseJsonToResponse<ConferenceDetailsResponse>(response.Content);
            conference.Participants.Count.Should().Be(_c.Test.HearingParticipants.Count + 1);
            new AssertParticipantFromAccount().User(_addedUser).Matches(conference.Participants);
        }

        [Then(@"the participant has been updated")]
        public void ThenTheParticipantDetailsHaveBeenUpdated()
        {
            new PollForUpdatedParticipant(_c.Apis.VideoApi).WithUsername(_updatedUser.Username).WithConferenceId(_c.Test.NewConferenceId).WithUpdatedRequest(_updatedRequest)
                .Poll()
                .Should().BeTrue("Updated participant found");
        }

        [Then(@"the participant has been removed")]
        public void ThenTheParticipantHasBeenRemoved()
        {
            new PollForParticipant(_c.Apis.VideoApi).WithConferenceId(_c.Test.NewConferenceId).WithParticipant(_deletedUser.Username)
                .IsRemoved().Poll().Should().BeTrue("Participant deleted");

            var response = _c.Apis.VideoApi.GetConferenceByConferenceId(_c.Test.NewConferenceId);
            var conference = RequestHelper.DeserialiseSnakeCaseJsonToResponse<ConferenceDetailsResponse>(response.Content);
            conference.Participants.Any(x => x.Ref_id.Equals(_deletedUser.Id)).Should().BeFalse();
            conference.Participants.Count.Should().Be(_c.Test.HearingParticipants.Count - 1);
        }

        [AfterScenario("UpdateParticipant")]
        public static void ResetUpdatedParticipant(TestContext context)
        {
            var updatedUser = context.Test.Hearing.Participants.First();
            var updatedRequest = new UpdateParticipantBuilder()
                .ForParticipant(updatedUser)
                .AddWordToStrings(context.Test.TestData.UpdatedWord)
                .Reset();

            var bookingsApiManager = new BookingsApiManager(context.VideoWebConfig.VhServices.BookingsApiUrl, context.Tokens.BookingsApiBearerToken);
            var response = bookingsApiManager.UpdateParticipantDetails(context.Test.NewHearingId, updatedUser.Id, updatedRequest);
            response.StatusCode.Should().Be(HttpStatusCode.OK);
        }
    }
}

