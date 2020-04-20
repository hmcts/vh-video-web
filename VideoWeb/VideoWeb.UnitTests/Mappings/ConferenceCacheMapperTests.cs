using System.Collections.Generic;
using System.Linq;
using FizzWare.NBuilder;
using FluentAssertions;
using NUnit.Framework;
using VideoWeb.Common.Caching;
using VideoWeb.Services.Video;
using VideoWeb.UnitTests.Builders;
using BookingParticipant = VideoWeb.Services.Bookings.ParticipantResponse;

namespace VideoWeb.UnitTests.Mappings
{
    public class ConferenceCacheMapperTests
    {
        [Test]
        public void Should_map_all_properties()
        {
            var conference = BuildConferenceDetailsResponse();
            var response = ConferenceCacheMapper.MapConferenceToCacheModel(conference);
            
            response.Id.Should().Be(conference.Id);
            response.HearingId.Should().Be(conference.Hearing_id);

            response.Participants.Count.Should().Be(conference.Participants.Count);

            var participant = conference.Participants[0];
            var resultParticipant  = response.Participants[0];

            resultParticipant.Id.Should().Be(participant.Id);
            resultParticipant.Username.Should().Be(participant.Username);
            resultParticipant.Role.Should().Be(participant.User_role);
            resultParticipant.DisplayName.Should().Be(participant.Display_name);
        }

        private static ConferenceDetailsResponse BuildConferenceDetailsResponse()
        {
            var participants = new List<ParticipantDetailsResponse>
            {
                new ParticipantDetailsResponseBuilder(UserRole.Individual, "Claimant").Build(),
                new ParticipantDetailsResponseBuilder(UserRole.Individual, "Defendant").Build(),
                new ParticipantDetailsResponseBuilder(UserRole.Representative, "Defendant").Build(),
                new ParticipantDetailsResponseBuilder(UserRole.Judge, "None").Build(),
                new ParticipantDetailsResponseBuilder(UserRole.CaseAdmin, "None").Build()
            };

            var bookingParticipants = Builder<BookingParticipant>.CreateListOfSize(participants.Count)
                .Build().ToList();
            participants[0].Ref_id = bookingParticipants[0].Id;
            participants[1].Ref_id = bookingParticipants[1].Id;
            participants[2].Ref_id = bookingParticipants[2].Id;
            participants[3].Ref_id = bookingParticipants[3].Id;
            participants[4].Ref_id = bookingParticipants[4].Id;

            var meetingRoom = Builder<MeetingRoomResponse>.CreateNew().Build();

            var conference = Builder<ConferenceDetailsResponse>.CreateNew()
                .With(x => x.Current_status = ConferenceState.Suspended)
                .With(x => x.Participants = participants)
                .With(x => x.Meeting_room = meetingRoom)
                .Build();
            return conference;
        }
    }
}
