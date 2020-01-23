using System.Net;
using Testing.Common.Helpers;
using VideoWeb.AcceptanceTests.Builders;
using VideoWeb.AcceptanceTests.Contexts;
using VideoWeb.Services.Bookings;

namespace VideoWeb.AcceptanceTests.Configuration.ConferenceRetrievers
{
    public class UpdateStatusToCreateConference
    {
        public void Create(TestContext context)
        {
            var updateRequest = new UpdateBookingStatusRequest
            {
                Status = UpdateBookingStatus.Created,
                Updated_by = context.GetCaseAdminUser().Username
            };

            context.Request = context.Patch(new BookingsApiUriFactory().HearingsEndpoints.UpdateHearingStatus(context.NewHearingId), updateRequest);

            new ExecuteRequestBuilder()
                .WithContext(context)
                .WithExpectedStatusCode(HttpStatusCode.NoContent)
                .SendToBookingsApi();
        }
    }
}
