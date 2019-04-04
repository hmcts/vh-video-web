using System;
using FluentAssertions;
using TechTalk.SpecFlow;
using Testing.Common.Helpers;
using VideoWeb.AcceptanceTests.Contexts;

namespace VideoWeb.AcceptanceTests.Hooks
{
    public static class DataSetupHooks
    {
        [AfterScenario]
        public static void RemoveConference(TestContext context, ConferenceEndpoints endpoints)
        {
            if (context.NewConferenceId == Guid.Empty) return;
            context.Request = context.Delete(endpoints.RemoveConference(context.NewConferenceId));
            context.Response = context.VideoApiClient().Execute(context.Request);
            context.Response.IsSuccessful.Should().BeTrue("New conference has been deleted after the test");
            context.NewConferenceId = Guid.Empty;
        }

        [AfterScenario]
        public static void RemoveHearing(TestContext context, HearingsEndpoints endpoints)
        {
            if (context.NewHearingId == Guid.Empty) return;
            context.Request = context.Delete(endpoints.RemoveHearing(context.NewHearingId));
            context.Response = context.BookingsApiClient().Execute(context.Request);
            context.Response.IsSuccessful.Should().BeTrue("New hearing has been deleted after the test");
            context.NewHearingId = Guid.Empty;
        }        
    }
}
