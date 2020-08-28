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
            resultParticipant.FirstName.Should().Be(participant.First_name);
            resultParticipant.LastName.Should().Be(participant.Last_name);
            resultParticipant.ContactEmail.Should().Be(participant.Contact_email);
            resultParticipant.ContactTelephone.Should().Be(participant.Contact_telephone);
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
            var endpoints = Builder<EndpointResponse>.CreateListOfSize(2).Build().ToList();

            var meetingRoom = Builder<MeetingRoomResponse>.CreateNew().Build();

            var conference = Builder<ConferenceDetailsResponse>.CreateNew()
                .With(x => x.Current_status = ConferenceState.Suspended)
                .With(x => x.Participants = participants)
                .With(x => x.Meeting_room = meetingRoom)
                .With(x => x.Endpoints = endpoints)
                .Build();
            return conference;
        }
    }
}
