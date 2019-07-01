using System;
using System.Collections.Generic;
using FluentAssertions;
using TechTalk.SpecFlow;
using Testing.Common.Configuration;
using Testing.Common.Helpers;
using VideoWeb.AcceptanceTests.Contexts;
using VideoWeb.Services.Bookings;
using VideoWeb.Services.Video;

namespace VideoWeb.AcceptanceTests.Hooks
{
    [Binding]
    public static class DataSetupHooks
    {
        [BeforeScenario]
        public static void ClearAnyHearings(TestContext context, HearingsEndpoints endpoints)
        {
            ClearHearings(context, endpoints, context.GetIndividualUsers());
            ClearHearings(context, endpoints, context.GetRepresentativeUsers());
        }

        private static void ClearHearings(TestContext context, HearingsEndpoints endpoints, IEnumerable<UserAccount> users)
        {
            foreach (var user in users)
            {
                context.Request = context.Get(endpoints.GetHearingsByUsername(user.Username));
                context.Response = context.BookingsApiClient().Execute(context.Request);
                var hearings =
                    ApiRequestHelper.DeserialiseSnakeCaseJsonToResponse<List<HearingDetailsResponse>>(context.Response
                        .Content);
                foreach (var hearing in hearings)
                {
                    context.Request = context.Delete(endpoints.RemoveHearing(hearing.Id));
                    context.Response = context.BookingsApiClient().Execute(context.Request);
                    context.Response.IsSuccessful.Should().BeTrue($"Hearing {hearing.Id} has been deleted");
                }
            }
        }

        [BeforeScenario]
        public static void ClearAnyConferences(TestContext context, ConferenceEndpoints endpoints)
        {
            ClearConferences(context, endpoints, context.GetIndividualUsers());
            ClearConferences(context, endpoints, context.GetRepresentativeUsers());
        }

        private static void ClearConferences(TestContext context, ConferenceEndpoints endpoints, IEnumerable<UserAccount> users)
        {
            foreach (var user in users)
            {
                context.Request = context.Get(endpoints.GetConferenceDetailsByUsername(user.Username));
                context.Response = context.VideoApiClient().Execute(context.Request);
                var conferences =
                    ApiRequestHelper.DeserialiseSnakeCaseJsonToResponse<List<ConferenceDetailsResponse>>(context.Response
                        .Content);
                foreach (var conference in conferences)
                {
                    context.Request = context.Delete(endpoints.RemoveConference(conference.Id));
                    context.Response = context.VideoApiClient().Execute(context.Request);
                    context.Response.IsSuccessful.Should().BeTrue($"Conference {conference.Id} has been deleted");
                }
            }
        }

        [AfterScenario]
        public static void RemoveConference(TestContext context, ConferenceEndpoints endpoints)
        {
            if (context.NewConferenceId == Guid.Empty || context.NewConferenceId == null) return;
            context.Request = context.Delete(endpoints.RemoveConference(context.NewConferenceId));
            context.Response = context.VideoApiClient().Execute(context.Request);
            context.Response.IsSuccessful.Should().BeTrue("New conference has been deleted after the test");
            context.NewConferenceId = Guid.Empty;
        }

        [AfterScenario]
        public static void RemoveHearing(TestContext context, HearingsEndpoints endpoints)
        {
            if (context.NewHearingId == Guid.Empty || context.NewHearingId == null) return;
            context.Request = context.Delete(endpoints.RemoveHearing(context.NewHearingId));
            context.Response = context.BookingsApiClient().Execute(context.Request);
            context.Response.IsSuccessful.Should().BeTrue("New hearing has been deleted after the test");
            context.NewHearingId = Guid.Empty;
        }
    }
}
