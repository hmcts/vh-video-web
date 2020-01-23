using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using AcceptanceTests.Common.Api.Hearings;
using AcceptanceTests.Common.Api.Uris;
using AcceptanceTests.Common.Configuration.Users;
using FluentAssertions;
using TechTalk.SpecFlow;
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
        private readonly BookingsApiManager _bookingsApiManager;
        private const string UpdatedWord = "Updated";
        private const int UpdatedTimeInMins = 1;
        private UserAccount _addedUser;
        private ParticipantResponse _updatedUser;
        private UpdateParticipantRequest _updatedRequest;
        private ParticipantResponse _deletedUser;

        public QueueSubscriberSteps(TestContext c)
        {
            _c = c;
            _bookingsApiManager = new BookingsApiManager(c.VideoWebConfig.VhServices.BookingsApiUrl, c.Tokens.BookingsApiBearerToken);
        }

        [When(@"I attempt to update the hearing details")]
        public void WhenIAttemptToUpdateTheHearingDetails()
        {         
            var request = new UpdateHearingRequestBuilder()           
                .ForHearing(_c.Hearing)
                .AddWordToStrings(UpdatedWord)
                .AddMinutesToTimes(UpdatedTimeInMins)
                .ChangeVenue()
                .UpdatedBy(UserManager.GetCaseAdminUser(_c.UserAccounts).Username)
                .Build();

            _c.Response = _bookingsApiManager.UpdateHearing(_c.Test.NewHearingId, request);
            _c.Response.StatusCode.Should().Be(HttpStatusCode.OK);
        }

        [When(@"I attempt to cancel the hearing")]
        public void WhenIAttemptToCancelTheHearing()
        {
            var request = new UpdateBookingStatusRequest()
            {
                Updated_by = UserManager.GetCaseAdminUser(_c.UserAccounts).Username,
                Status = UpdateBookingStatus.Cancelled
            };

            _c.Response = _bookingsApiManager.UpdateHearingDetails(_c.Test.NewHearingId, request);
            _c.Response.StatusCode.Should().Be(HttpStatusCode.NoContent);
        }

        [When(@"I attempt to delete the hearing")]
        public void WhenIAttemptToDeleteTheHearing()
        {
            _c.Response = _bookingsApiManager.DeleteHearing(_c.Test.NewHearingId);
            _c.Response.StatusCode.Should().Be(HttpStatusCode.NoContent);
        }

        [When(@"I add a participant to the hearing")]
        public void WhenIAttemptToAddAParticipantToTheHearing()
        {
            var participants = (from participant in _c.Hearing.Participants where participant.User_role_name.ToLower().Equals("individual") select participant.Last_name).ToList();
            _addedUser = UserManager.GetIndividualNotInHearing(_c.UserAccounts, participants);
            var request = new ParticipantsRequestBuilder().AddIndividual().WithUser(_addedUser).Build();
            var list = new AddParticipantsToHearingRequest() {Participants = new List<ParticipantRequest>() {request}};
            _c.Response = _bookingsApiManager.AddParticipantsToHearing(_c.Test.NewHearingId, list);
            _c.Response.StatusCode.Should().Be(HttpStatusCode.NoContent);
        }

        [When(@"I update a participant from the hearing")]
        public void WhenIUpdateAParticipantFromTheHearing()
        {
            _updatedUser = _c.Hearing.Participants.First();
            _updatedRequest = new UpdateParticipantBuilder()
                .ForParticipant(_updatedUser)
                .AddWordToStrings(UpdatedWord)
                .Build();

            _c.Response = _bookingsApiManager.UpdateParticipantDetails(_c.Test.NewHearingId, _updatedUser.Id, _updatedRequest);
            _c.Response.StatusCode.Should().Be(HttpStatusCode.OK);
        }

        [When(@"I remove a participant from the hearing")]
        public void WhenIRemoveAParticipantFromTheHearing()
        {
            _deletedUser = _c.Hearing.Participants.Find(x => x.User_role_name.Equals(UserRole.Individual.ToString()));
            _c.Response = _bookingsApiManager.RemoveParticipant(_c.Test.NewHearingId, _deletedUser.Id);
            _c.Response.StatusCode.Should().Be(HttpStatusCode.NoContent);
        }

        [Then(@"the conference has been created from the booking")]
        public void ThenTheConferenceHasBeenCreatedFromTheBooking()
        {
            _c.Conference.Current_status.Should().Be(ConferenceState.NotStarted);
            new AssertConference(_c.Conference).MatchesHearing(_c.Hearing);
        }      

        [Then(@"the conference details have been updated")]
        public void ThenTheConferenceDetailsHaveBeenUpdated()
        {
            new ConferenceDetailsResponseBuilder(_c).PollForUpdatedHearing(UpdatedWord);

            var conference = new ConferenceDetailsResponseBuilder(_c).GetConferenceDetails();
            conference.Case_name.Should().Contain(UpdatedWord);
            conference.Case_number.Should().Contain(UpdatedWord);
            conference.Scheduled_date_time.Should().Be(_c.Hearing.Scheduled_date_time.AddMinutes(UpdatedTimeInMins));
            conference.Scheduled_duration.Should().Be(_c.Hearing.Scheduled_duration + UpdatedTimeInMins);
        }

        [Then(@"the conference has been deleted")]
        public void ThenTheConferenceHasBeenDeleted()
        {
            new ConferenceDetailsResponseBuilder(_c).PollForExpectedStatus(HttpStatusCode.NotFound).Should().BeTrue();
            _c.Test.NewHearingId = Guid.Empty;
            _c.Test.NewConferenceId = Guid.Empty;
        }

        [Then(@"the participant has been added")]
        public void ThenTheParticipantHasBeenAdded()
        {
            new ConferenceDetailsResponseBuilder(_c)
                .IsAdded()
                .WithUsername(_addedUser.Username)
                .PollForParticipant()
                .Should().BeTrue("Participant found");

            var conference = new ConferenceDetailsResponseBuilder(_c).GetConferenceDetails();
            var participants = conference.Participants;
            participants.Count.Should().Be(_c.Hearing.Participants.Count + 1);
            new AssertParticipantFromAccount().User(_addedUser).Matches(participants);
        }

        [Then(@"the participant has been updated")]
        public void ThenTheParticipantDetailsHaveBeenUpdated()
        {
            new ConferenceDetailsResponseBuilder(_c)
                .IsAdded()
                .WithUsername(_updatedUser.Username)
                .ExpectedUpdate(_updatedRequest)
                .PollForParticipantUpdated()
                .Should().BeTrue("Updated participant found");
        }

        [Then(@"the participant has been removed")]
        public void ThenTheParticipantHasBeenRemoved()
        {
            new ConferenceDetailsResponseBuilder(_c)
                .IsRemoved()
                .WithUsername(_deletedUser.Username)
                .PollForParticipant()
                .Should().BeTrue("Participant deleted");

            var conference = new ConferenceDetailsResponseBuilder(_c).GetConferenceDetails();
            conference.Participants.Any(x => x.Ref_id.Equals(_deletedUser.Id)).Should().BeFalse();
            conference.Participants.Count.Should().Be(_c.Hearing.Participants.Count - 1);
        }

        [AfterScenario("UpdateParticipant")]
        public static void ResetUpdatedParticipant(TestContext context)
        {
            var updatedUser = context.Hearing.Participants.First();
            var updatedRequest = new UpdateParticipantBuilder()
                .ForParticipant(updatedUser)
                .AddWordToStrings(UpdatedWord)
                .Reset();
            var endpoint = new BookingsApiUriFactory().HearingsParticipantsEndpoints.UpdateParticipantDetails(context.Test.NewHearingId, updatedUser.Id);
            context.Request = context.Put(endpoint, updatedRequest);

            new ExecuteRequestBuilder()
                .WithContext(context)
                .WithExpectedStatusCode(HttpStatusCode.OK)
                .SendToBookingsApi();
        }
    }
}

