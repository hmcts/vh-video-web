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
            resultParticipant.HearingRole.Should().Be(participant.Hearing_role);
            resultParticipant.DisplayName.Should().Be(participant.Display_name);
            resultParticipant.FirstName.Should().Be(participant.First_name);
            resultParticipant.LastName.Should().Be(participant.Last_name);
            resultParticipant.ContactEmail.Should().Be(participant.Contact_email);
            resultParticipant.ContactTelephone.Should().Be(participant.Contact_telephone);
            resultParticipant.Representee.Should().Be(participant.Representee);
            resultParticipant.LinkedParticipants.Count.Should().Be(participant.Linked_participants.Count);
            resultParticipant.LinkedParticipants[0].LinkType.ToString().Should()
                .Be(participant.Linked_participants[0].Type.ToString());
            resultParticipant.LinkedParticipants[0].LinkedId.Should()
                .Be(participant.Linked_participants[0].Linked_id);

            var judge = response.Participants.First(x => x.HearingRole == "Judge");
            judge.IsJudge().Should().BeTrue();
            judge.IsWitness().Should().BeFalse();
            
            var witness = response.Participants.First(x => x.HearingRole == "Witness");
            witness.IsJudge().Should().BeFalse();
            witness.IsWitness().Should().BeTrue();
        }

        private static ConferenceDetailsResponse BuildConferenceDetailsResponse()
        {
            var participants = new List<ParticipantDetailsResponse>
            {
                new ParticipantDetailsResponseBuilder(UserRole.Individual, "Claimant")
                    .WithHearingRole("Litigant in person").Build(),
                new ParticipantDetailsResponseBuilder(UserRole.Individual, "Defendant")
                    .WithHearingRole("Litigant in person").Build(),
                new ParticipantDetailsResponseBuilder(UserRole.Representative, "Defendant")
                    .WithHearingRole("Professional").Build(),
                new ParticipantDetailsResponseBuilder(UserRole.Judge, "None").WithHearingRole("Judge").Build(),
                new ParticipantDetailsResponseBuilder(UserRole.CaseAdmin, "None").Build(),
                new ParticipantDetailsResponseBuilder(UserRole.Individual, "Claimant").WithHearingRole("Witness")
                    .Build()
            };
            var participantA = participants[0];
            var participantB = participants[1];
            participantA.Linked_participants.Add(new LinkedParticipantResponse
            {
                Linked_id = participantB.Id,
                Participant_id = participantA.Id,
                Type = LinkedParticipantType.Interpreter
            });
            
            participantB.Linked_participants.Add(new LinkedParticipantResponse
            {
                Linked_id = participantA.Id,
                Participant_id = participantB.Id,
                Type = LinkedParticipantType.Interpreter
            });
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
