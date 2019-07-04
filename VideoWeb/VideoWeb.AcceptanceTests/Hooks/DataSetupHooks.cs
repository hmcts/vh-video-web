using System;
using System.Collections.Generic;
using FluentAssertions;
using RestSharp.Extensions;
using TechTalk.SpecFlow;
using Testing.Common.Configuration;
using Testing.Common.Helpers;
using VideoWeb.AcceptanceTests.Contexts;
using VideoWeb.Services.Video;

namespace VideoWeb.AcceptanceTests.Hooks
{
    [Binding]
    public static class DataSetupHooks
    {
        [BeforeScenario]
        public static void WriteTestNameToConsoleBefore(ScenarioContext context)
        {
            Console.WriteLine($"Starting test : {context.ScenarioInfo.Title}");
        }

        [AfterScenario]
        public static void WriteTestNameToConsoleAfter(ScenarioContext context)
        {
            Console.WriteLine($"Finished test: {context.ScenarioInfo.Title}");
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
                if (!context.Response.Content.HasValue()) continue;
                var conferences =
                    ApiRequestHelper.DeserialiseSnakeCaseJsonToResponse<List<ConferenceDetailsResponse>>(context
                        .Response
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
            if (context.NewHearingId == Guid.Empty || context.NewHearingId == null || context.HearingIsNotInBookingsDb) return;
            context.Request = context.Delete(endpoints.RemoveHearing(context.NewHearingId));
            context.Response = context.BookingsApiClient().Execute(context.Request);
            context.Response.IsSuccessful.Should().BeTrue("New hearing has been deleted after the test");
            context.NewHearingId = Guid.Empty;
        }
    }
}
