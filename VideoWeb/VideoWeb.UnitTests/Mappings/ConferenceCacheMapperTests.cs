using System.Collections.Generic;
using System.Linq;
using FizzWare.NBuilder;
using FluentAssertions;
using NUnit.Framework;
using VideoWeb.Common.Caching;
using VideoApi.Contract.Responses;
using VideoWeb.UnitTests.Builders;
using VideoApi.Contract.Enums;

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
            response.HearingId.Should().Be(conference.HearingId);

            response.Participants.Count.Should().Be(conference.Participants.Count);

            var participant = conference.Participants[0];
            var resultParticipant  = response.Participants[0];

            resultParticipant.Id.Should().Be(participant.Id);
            resultParticipant.Username.Should().Be(participant.Username);
            resultParticipant.Role.Should().Be(participant.UserRole);
            resultParticipant.HearingRole.Should().Be(participant.HearingRole);
            resultParticipant.DisplayName.Should().Be(participant.DisplayName);
            resultParticipant.FirstName.Should().Be(participant.FirstName);
            resultParticipant.LastName.Should().Be(participant.LastName);
            resultParticipant.ContactEmail.Should().Be(participant.ContactEmail);
            resultParticipant.ContactTelephone.Should().Be(participant.ContactTelephone);
            resultParticipant.Representee.Should().Be(participant.Representee);
            resultParticipant.LinkedParticipants.Count.Should().Be(participant.LinkedParticipants.Count);
            resultParticipant.LinkedParticipants[0].LinkType.ToString().Should()
                .Be(participant.LinkedParticipants[0].Type.ToString());
            resultParticipant.LinkedParticipants[0].LinkedId.Should()
                .Be(participant.LinkedParticipants[0].LinkedId);

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
            participantA.LinkedParticipants.Add(new LinkedParticipantResponse
            {
                LinkedId = participantB.Id,
                Type = LinkedParticipantType.Interpreter
            });
            
            participantB.LinkedParticipants.Add(new LinkedParticipantResponse
            {
                LinkedId = participantA.Id,
                Type = LinkedParticipantType.Interpreter
            });
            var endpoints = Builder<EndpointResponse>.CreateListOfSize(2).Build().ToList();

            var meetingRoom = Builder<MeetingRoomResponse>.CreateNew().Build();

            var conference = Builder<ConferenceDetailsResponse>.CreateNew()
                .With(x => x.CurrentStatus = ConferenceState.Suspended)
                .With(x => x.Participants = participants)
                .With(x => x.MeetingRoom = meetingRoom)
                .With(x => x.Endpoints = endpoints)
                .Build();
            return conference;
        }
    }
}
