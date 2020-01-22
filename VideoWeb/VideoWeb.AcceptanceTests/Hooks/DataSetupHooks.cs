using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using FluentAssertions;
using TechTalk.SpecFlow;
using Testing.Common.Helpers;
using VideoWeb.AcceptanceTests.Contexts;
using VideoWeb.Common.Helpers;
using VideoWeb.Services.Bookings;
using VideoWeb.Services.Video;

namespace VideoWeb.AcceptanceTests.Hooks
{
    [Binding]
    public static class DataSetupHooks
    {
        [BeforeScenario]
        [AfterScenario]
        private static void ClearHearingsForClerk(TestContext context, HearingsEndpoints endpoints)
        {
            context.Request = context.Get(endpoints.GetHearingsByUsername(context.GetClerkUser().Username));
            context.Response = context.BookingsApiClient().Execute(context.Request);
            var hearings = ApiRequestHelper.DeserialiseSnakeCaseJsonToResponse<List<HearingDetailsResponse>>(context.Response.Content);
            if (hearings == null) return;
            foreach (var hearing in hearings)
            {
                DeleteTheHearing(hearing.Id, context);
            }
        }

        [BeforeScenario]
        [AfterScenario]
        private static void ClearClosedConferencesForClerk(TestContext context, ConferenceEndpoints conferenceEndpoints)
        {
            context.Request = context.Get(conferenceEndpoints.GetTodaysConferences);
            context.Response = context.VideoApiClient().Execute(context.Request);
            var todaysConferences = ApiRequestHelper.DeserialiseSnakeCaseJsonToResponse<List<ConferenceSummaryResponse>>(context.Response.Content);
            if (todaysConferences == null) return;

            foreach (var conference in todaysConferences)
            {
                if (!ClerkUserIsAParticipantInTheConference(conference.Participants, context.GetClerkUser().Username)) continue;
                
                var hearingId = GetTheHearingIdFromTheConference(conference.Id, context);

                if (HearingHasNotBeenDeletedAlready(hearingId, context) && !hearingId.Equals(Guid.Empty))
                    DeleteTheHearing(hearingId, context);

                if (ConferenceHasNotBeenDeletedAlready(conference.Id, context))
                    DeleteTheConference(conference.Id, context);
            }
        }

        private static bool ClerkUserIsAParticipantInTheConference(IEnumerable<ParticipantSummaryResponse> participants, string username)
        {
            return participants.Any(x => x.Username.ToLower().Equals(username.ToLower()));
        }

        private static Guid GetTheHearingIdFromTheConference(Guid? conferenceId, TestContext context)
        {
            if (conferenceId == null)
                throw new DataMisalignedException("Conference Id must be set");

            context.Request = context.Get(new VideoApiUriFactory().ConferenceEndpoints.GetConferenceDetailsById((Guid)conferenceId));
            context.Response = context.VideoApiClient().Execute(context.Request);
            var conference = ApiRequestHelper.DeserialiseSnakeCaseJsonToResponse<ConferenceDetailsResponse>(context.Response.Content);

            return conference.Hearing_id == Guid.Empty ? Guid.Empty : conference.Hearing_id;
        }

        private static bool HearingHasNotBeenDeletedAlready(Guid hearingId, TestContext context)
        { 
            context.Request = context.Get(new BookingsApiUriFactory().HearingsEndpoints.GetHearingDetailsById(hearingId));
            context.Response = context.BookingsApiClient().Execute(context.Request);
            return !context.Response.StatusCode.Equals(HttpStatusCode.NotFound);
        }

        private static bool ConferenceHasNotBeenDeletedAlready(Guid? conferenceId, TestContext context)
        {
            if (conferenceId == null)
                throw new DataMisalignedException("Conference Id must be set");

            context.Request = context.Get(new VideoApiUriFactory().ConferenceEndpoints.GetConferenceDetailsById((Guid)conferenceId));
            context.Response = context.VideoApiClient().Execute(context.Request);
            return !context.Response.StatusCode.Equals(HttpStatusCode.NotFound);
        }

        private static void DeleteTheHearing(Guid? hearingId, TestContext context)
        {
            context.Request = context.Delete(new BookingsApiUriFactory().HearingsEndpoints.RemoveHearing(hearingId));
            context.Response = context.BookingsApiClient().Execute(context.Request);
            context.Response.IsSuccessful.Should().BeTrue($"Hearing {hearingId} has been deleted. Status {context.Response.StatusCode}. {context.Response.Content}");
        }

        private static void DeleteTheConference(Guid? conferenceId, TestContext context)
        {
            context.Request = context.Delete(new VideoApiUriFactory().ConferenceEndpoints.RemoveConference(conferenceId));
            context.Response = context.VideoApiClient().Execute(context.Request);
        }
    }
}
