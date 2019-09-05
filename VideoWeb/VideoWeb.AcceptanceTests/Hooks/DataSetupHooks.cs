using System.Collections.Generic;
using FluentAssertions;
using TechTalk.SpecFlow;
using Testing.Common.Helpers;
using VideoWeb.AcceptanceTests.Contexts;
using VideoWeb.Common.Helpers;
using VideoWeb.Services.Bookings;

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
                context.Request = context.Delete(endpoints.RemoveHearing(hearing.Id));
                context.Response = context.BookingsApiClient().Execute(context.Request);
                context.Response.IsSuccessful.Should().BeTrue($"Hearing {hearing.Id} has been deleted");
            }
        }       
    }
}
