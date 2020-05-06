using System;
using System.Collections.Generic;
using System.Net;
using AcceptanceTests.Common.Api.Hearings;
using AcceptanceTests.Common.Api.Helpers;
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

        [BeforeScenario(Order = (int)HooksSequence.RemoveDataHooks)]
        [AfterScenario]
        public void RemovePreviousHearings(TestContext context)
        {
            _clerkUsername = UserManager.GetClerkUser(context.UserAccounts).Username;
            ClearHearingsForClerk(context.Apis.BookingsApi);
            ClearClosedConferencesForClerk(context.Apis.BookingsApi, context.Apis.VideoApi);
        }

        private void ClearHearingsForClerk(BookingsApiManager bookingsApi)
        {
            var response = bookingsApi.GetHearingsForUsername(_clerkUsername);
            var hearings = RequestHelper.DeserialiseSnakeCaseJsonToResponse<List<HearingDetailsResponse>>(response.Content);
            if (hearings == null) return;
            foreach (var hearing in hearings)
            {
                DeleteTheHearing(bookingsApi, hearing.Id);
            }
        }
        private static void DeleteTheHearing(BookingsApiManager bookingsApi, Guid hearingId)
        {
            var response = bookingsApi.DeleteHearing(hearingId);
            response.IsSuccessful.Should().BeTrue($"HearingDetails {hearingId} has been deleted. Status {response.StatusCode}. {response.Content}");
        }

        private void ClearClosedConferencesForClerk(BookingsApiManager bookingsApi, VideoApiManager videoApi)
        {
            var response = videoApi.GetConferencesForTodayJudge(_clerkUsername);
            var todaysConferences = RequestHelper.DeserialiseSnakeCaseJsonToResponse<List<ConferenceForAdminResponse>>(response.Content);
            if (todaysConferences == null) return;

            foreach (var conference in todaysConferences)
            {
                var hearingId = GetTheHearingIdFromTheConference(videoApi, conference.Id);

                if (HearingHasNotBeenDeletedAlready(bookingsApi, hearingId) && !hearingId.Equals(Guid.Empty))
                    DeleteTheHearing(bookingsApi, hearingId);

                if (ConferenceHasNotBeenDeletedAlready(videoApi, conference.Id))
                    DeleteTheConference(videoApi, conference.Id);
            }
        }

        private static Guid GetTheHearingIdFromTheConference(VideoApiManager videoApi, Guid conferenceId)
        {
            var response = videoApi.GetConferenceByConferenceId(conferenceId);
            var conference = RequestHelper.DeserialiseSnakeCaseJsonToResponse<ConferenceDetailsResponse>(response.Content);
            return conference?.Hearing_id ?? Guid.Empty;
        }

        private static bool HearingHasNotBeenDeletedAlready(BookingsApiManager bookingsApi, Guid hearingId)
        {
            var response = bookingsApi.GetHearing(hearingId);
            return !response.StatusCode.Equals(HttpStatusCode.NotFound);
        }

        private static bool ConferenceHasNotBeenDeletedAlready(VideoApiManager videoApi, Guid conferenceId)
        {
            var response = videoApi.GetConferenceByConferenceId(conferenceId);
            return !response.StatusCode.Equals(HttpStatusCode.NotFound);
        }

        private static void DeleteTheConference(VideoApiManager videoApi, Guid conferenceId)
        {
            videoApi.DeleteConference(conferenceId);
        }
    }
}
