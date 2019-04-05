using FluentAssertions;
using VideoWeb.Services.Video;

namespace Testing.Common.Assertions
{
    public class AssertConferenceDetailsResponse
    {
        protected AssertConferenceDetailsResponse()
        {
        }

        public static void ForConference(ConferenceDetailsResponse conference)
        {
            conference.Should().NotBeNull();
            conference.Case_type.Should().NotBeNullOrEmpty();
            conference.Case_number.Should().NotBeNullOrEmpty();
            conference.Case_name.Should().NotBeNullOrEmpty();

            foreach (var participant in conference.Participants)
            {
                participant.Id.Should().NotBeEmpty();
                participant.Name.Should().NotBeNullOrEmpty();
                participant.Display_name.Should().NotBeNullOrEmpty();
                participant.Username.Should().NotBeNullOrEmpty();
                participant.Case_type_group.Should().NotBeNullOrEmpty();
            }
        }
    }
}
