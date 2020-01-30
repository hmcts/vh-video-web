using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using AcceptanceTests.Common.Api.Clients;
using AcceptanceTests.Common.Api.Requests;
using AcceptanceTests.Common.Api.Uris;
using AcceptanceTests.Common.Configuration.Users;
using FluentAssertions;
using TechTalk.SpecFlow;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.Services.Bookings;
using VideoWeb.Services.Video;

namespace VideoWeb.AcceptanceTests.Hooks
{
    [Binding]
    public sealed class RemoveDataHooks
    {
        private string _clerkUsername;
        private string _bookingApiUrl;
        private string _bookingsApiBearerToken;
        private string _videoApiUrl;
        private string _videoApiBearerToken;

        [BeforeScenario(Order = (int)HooksSequence.RemoveDataHooks)]
        [AfterScenario]
        public void RemovePreviousHearings(TestContext context)
        {
            _clerkUsername = UserManager.GetClerkUser(context.UserAccounts).Username;
            _bookingApiUrl = context.VideoWebConfig.VhServices.BookingsApiUrl;
            _bookingsApiBearerToken = context.Tokens.BookingsApiBearerToken;
            _videoApiUrl = context.VideoWebConfig.VhServices.VideoApiUrl;
            _videoApiBearerToken = context.Tokens.VideoApiBearerToken;
            ClearHearingsForClerk();
            ClearClosedConferencesForClerk();
        }

        private void ClearHearingsForClerk()
        {
            var endpoint = new HearingsEndpoints().GetHearingsByUsername(_clerkUsername);
            var request = new RequestBuilder().Get(endpoint);
            var client = new ApiClient(_bookingApiUrl, _bookingsApiBearerToken).GetClient();
            var response = new RequestExecutor(request).SendToApi(client);
            var hearings = RequestHelper.DeserialiseSnakeCaseJsonToResponse<List<HearingDetailsResponse>>(response.Content);
            if (hearings == null) return;
            foreach (var hearing in hearings)
            {
                DeleteTheHearing(hearing.Id);
            }
        }
        private void DeleteTheHearing(Guid? hearingId)
        {
            var endpoint = new BookingsApiUriFactory().HearingsEndpoints.RemoveHearing(hearingId);
            var request = new RequestBuilder().Delete(endpoint);
            var client = new ApiClient(_bookingApiUrl, _bookingsApiBearerToken).GetClient();
            var response = new RequestExecutor(request).SendToApi(client);
            response.IsSuccessful.Should().BeTrue($"HearingDetails {hearingId} has been deleted. Status {response.StatusCode}. {response.Content}");
        }

        private void ClearClosedConferencesForClerk()
        {
            var endpoint = new VideoApiUriFactory().ConferenceEndpoints.GetTodaysConferences;
            var request = new RequestBuilder().Get(endpoint);
            var client = new ApiClient(_videoApiUrl, _videoApiBearerToken).GetClient();
            var response = new RequestExecutor(request).SendToApi(client);
            var todaysConferences = RequestHelper.DeserialiseSnakeCaseJsonToResponse<List<ConferenceSummaryResponse>>(response.Content);
            if (todaysConferences == null) return;

            foreach (var conference in todaysConferences)
            {
                if (!ClerkUserIsAParticipantInTheConference(conference.Participants, _clerkUsername)) continue;

                var hearingId = GetTheHearingIdFromTheConference(conference.Id);

                if (HearingHasNotBeenDeletedAlready(hearingId) && !hearingId.Equals(Guid.Empty))
                    DeleteTheHearing(hearingId);

                if (ConferenceHasNotBeenDeletedAlready(conference.Id))
                    DeleteTheConference(conference.Id);
            }
        }
        private static bool ClerkUserIsAParticipantInTheConference(IEnumerable<ParticipantSummaryResponse> participants, string username)
        {
            return participants.Any(x => x.Username.ToLower().Equals(username.ToLower()));
        }

        private Guid GetTheHearingIdFromTheConference(Guid conferenceId)
        {
            var endpoint = new VideoApiUriFactory().ConferenceEndpoints.GetConferenceDetailsById(conferenceId);
            var request = new RequestBuilder().Get(endpoint);
            var client = new ApiClient(_videoApiUrl, _videoApiBearerToken).GetClient();
            var response = new RequestExecutor(request).SendToApi(client);
            var conference = RequestHelper.DeserialiseSnakeCaseJsonToResponse<ConferenceDetailsResponse>(response.Content);
            return conference.Hearing_id;
        }

        private bool HearingHasNotBeenDeletedAlready(Guid hearingId)
        {
            var endpoint = new BookingsApiUriFactory().HearingsEndpoints.GetHearingDetailsById(hearingId);
            var request = new RequestBuilder().Get(endpoint);
            var client = new ApiClient(_bookingApiUrl, _bookingsApiBearerToken).GetClient();
            var response = new RequestExecutor(request).SendToApi(client);
            return !response.StatusCode.Equals(HttpStatusCode.NotFound);
        }

        private bool ConferenceHasNotBeenDeletedAlready(Guid? conferenceId)
        {
            if (conferenceId == null)
                throw new DataMisalignedException("Conference Id must be set");

            var endpoint = new VideoApiUriFactory().ConferenceEndpoints.GetConferenceDetailsById((Guid)conferenceId);
            var request = new RequestBuilder().Get(endpoint);
            var client = new ApiClient(_videoApiUrl, _videoApiBearerToken).GetClient();
            var response = new RequestExecutor(request).SendToApi(client);
            return !response.StatusCode.Equals(HttpStatusCode.NotFound);
        }

        private void DeleteTheConference(Guid? conferenceId)
        {
            var endpoint = new VideoApiUriFactory().ConferenceEndpoints.RemoveConference(conferenceId);
            var request = new RequestBuilder().Get(endpoint);
            var client = new ApiClient(_videoApiUrl, _videoApiBearerToken).GetClient();
            new RequestExecutor(request).SendToApi(client);
        }
    }
}
