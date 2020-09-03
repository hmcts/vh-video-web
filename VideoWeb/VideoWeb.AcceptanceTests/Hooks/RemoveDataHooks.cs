using System;
using System.Collections.Generic;
using System.Net;
using AcceptanceTests.Common.Api.Hearings;
using AcceptanceTests.Common.Api.Helpers;
using FluentAssertions;
using TechTalk.SpecFlow;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.Services.TestApi;

namespace VideoWeb.AcceptanceTests.Hooks
{
    [Binding]
    public sealed class RemoveDataHooks
    {
        private string _username;

        [AfterScenario]
        public void RemovePreviousHearings(TestContext context)
        {
            if (context?.Test?.Users == null) return;
            if (context.Test?.Users?.Count == 0) return;
            _username = Users.GetJudgeUser(context.Test.Users).Username;
            ClearHearingsForUser(context.Apis.TestApi);
            ClearClosedConferencesForUser(context.Apis.TestApi);
        }

        private void ClearHearingsForUser(TestApiManager api)
        {
            var response = api.GetHearingsByUsername(_username);
            var hearings = RequestHelper.Deserialise<List<HearingDetailsResponse>>(response.Content);
            if (hearings == null) return;
            foreach (var hearing in hearings)
            {
                DeleteTheHearing(api, hearing.Id);
            }
        }

        private static void DeleteTheHearing(TestApiManager api, Guid hearingId)
        {
            var response = api.DeleteHearing(hearingId);
            response.IsSuccessful.Should().BeTrue($"HearingDetails {hearingId} has been deleted. Status {response.StatusCode}. {response.Content}");
        }

        private void ClearClosedConferencesForUser(TestApiManager api)
        {
            var response = api.GetConferencesForTodayJudge(_username);
            var todaysConferences = RequestHelper.Deserialise<List<ConferenceForJudgeResponse>>(response.Content);
            if (todaysConferences == null) return;

            foreach (var conference in todaysConferences)
            {
                var hearingId = GetTheHearingIdFromTheConference(api, conference.Id);

                if (HearingHasNotBeenDeletedAlready(api, hearingId) && !hearingId.Equals(Guid.Empty))
                    DeleteTheHearing(api, hearingId);

                if (ConferenceHasNotBeenDeletedAlready(api, conference.Id))
                    DeleteTheConference(api, hearingId, conference.Id);
            }
        }

        private static Guid GetTheHearingIdFromTheConference(TestApiManager api, Guid conferenceId)
        {
            var response = api.GetConferenceByConferenceId(conferenceId);
            if (!response.IsSuccessful) return Guid.Empty;
            var conference = RequestHelper.Deserialise<ConferenceDetailsResponse>(response.Content);
            return conference.Hearing_id;
        }

        private static bool HearingHasNotBeenDeletedAlready(TestApiManager api, Guid hearingId)
        {
            var response = api.GetHearing(hearingId);
            return !response.StatusCode.Equals(HttpStatusCode.NotFound);
        }

        private static bool ConferenceHasNotBeenDeletedAlready(TestApiManager api, Guid conferenceId)
        {
            var response = api.GetConferenceByConferenceId(conferenceId);
            return !response.StatusCode.Equals(HttpStatusCode.NotFound);
        }

        private static void DeleteTheConference(TestApiManager api, Guid hearingId, Guid conferenceId)
        {
            api.DeleteConference(hearingId, conferenceId);
        }
    }
}
