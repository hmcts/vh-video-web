using System;
using FluentAssertions;
using VideoWeb.Services.Bookings;

namespace Testing.Common.Assertions
{
    public class AssertHearingResponse
    {
        protected AssertHearingResponse()
        {

        }

        public static void ForHearing(HearingDetailsResponse hearing)
        {
            hearing.Case_type_name.Should().NotBeNullOrEmpty();
            foreach (var theCase in hearing.Cases)
            {
                theCase.Name.Should().NotBeNullOrEmpty();
                theCase.Number.Should().NotBeNullOrEmpty();
            }

            hearing.Hearing_type_name.Should().NotBeNullOrEmpty();
            hearing.Hearing_venue_name.Should().NotBeNullOrEmpty();
            foreach (var participant in hearing.Participants)
            {
                participant.Case_role_name.Should().NotBeNullOrEmpty();
                participant.Contact_email.Should().NotBeNullOrEmpty();
                participant.Display_name.Should().NotBeNullOrEmpty();
                participant.First_name.Should().NotBeNullOrEmpty();
                participant.Hearing_role_name.Should().NotBeNullOrEmpty();
                participant.Id.Should().NotBeEmpty();
                participant.Last_name.Should().NotBeNullOrEmpty();
                participant.Telephone_number.Should().NotBeNullOrEmpty();
                participant.Title.Should().NotBeNullOrEmpty();
                participant.User_role_name.Should().NotBeNullOrEmpty();
            }

            hearing.Scheduled_date_time.Should().BeAfter(DateTime.MinValue);
            hearing.Scheduled_duration.Should().BePositive();
        }
    }
}
