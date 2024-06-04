using System.Collections.Generic;
using System.Linq;
using BookingsApi.Contract.V2.Enums;
using BookingsApi.Contract.V2.Responses;
using FizzWare.NBuilder;
using FluentAssertions;
using NUnit.Framework;
using VideoWeb.Common.Caching;
using VideoApi.Contract.Responses;
using VideoWeb.UnitTests.Builders;
using VideoApi.Contract.Enums;
using VideoWeb.Common.Models;

namespace VideoWeb.UnitTests.Mappings
{
    public class ConferenceCacheMapperTests
    {
        [Test]
        public void Should_map_all_properties()
        {
            var conference = BuildConferenceDetailsResponse();
            var hearingResponse = BuildHearingDetailsResponse(conference);
            var response = ConferenceCacheMapper.MapConferenceToCacheModel(conference, hearingResponse);
            
            response.Id.Should().Be(conference.Id);
            response.HearingId.Should().Be(conference.HearingId);

            response.Participants.Count.Should().Be(conference.Participants.Count);

            var participant = conference.Participants[0];
            var resultParticipant  = response.Participants[0];

            resultParticipant.Id.Should().Be(participant.Id);
            resultParticipant.Username.Should().Be(participant.Username);
            resultParticipant.Role.Should().Be((Role)participant.UserRole);
            resultParticipant.HearingRole.Should().Be(participant.HearingRole);
            resultParticipant.DisplayName.Should().Be(participant.DisplayName);
            resultParticipant.FirstName.Should().Be(participant.FirstName);
            resultParticipant.LastName.Should().Be(participant.LastName);
            resultParticipant.ContactEmail.Should().Be(participant.ContactEmail);
            resultParticipant.ContactTelephone.Should().Be(participant.ContactTelephone);
            resultParticipant.Representee.Should().Be(participant.Representee);
            resultParticipant.LinkedParticipants.Count.Should().Be(participant.LinkedParticipants.Count);
            resultParticipant.LinkedParticipants[0].LinkType.ToString().Should().Be(participant.LinkedParticipants[0].Type.ToString());
            resultParticipant.LinkedParticipants[0].LinkedId.Should().Be(participant.LinkedParticipants[0].LinkedId);

            var judge = response.Participants.First(x => x.HearingRole == "Judge");
            judge.IsJudge().Should().BeTrue();
            judge.IsWitness().Should().BeFalse();
            
            var witness = response.Participants.First(x => x.HearingRole == "Witness");
            witness.IsJudge().Should().BeFalse();
            witness.IsWitness().Should().BeTrue();
            
            foreach (var endpoint in response.Endpoints)
            {
                conference.Endpoints.Select(x => x.Id).Should().Contain(endpoint.Id);
                conference.Endpoints.Select(x => x.DisplayName).Should().Contain(endpoint.DisplayName);
                conference.Endpoints.Select(x => x.Status).Should().Contain((EndpointState)endpoint.EndpointStatus);
                
                var endpointParticipants =
                    hearingResponse.Endpoints.Single(x => x.Id == endpoint.Id).EndpointParticipants;
                                
                foreach (var ep in endpoint.EndpointParticipants)
                {
                    var expected = endpointParticipants.Single(x => x.ParticipantId == ep.ParticipantRefId);
                    ep.ParticipantUsername.Should().Be(expected.ParticipantUsername);
                    ep.LinkedParticipantType.Should().Be((LinkType)expected.LinkedParticipantType);
                }
            }
        }
        
        private HearingDetailsResponseV2 BuildHearingDetailsResponse(ConferenceDetailsResponse conference)
        {
            var endpointParticipants = new List<EndpointParticipantResponse>
            {
                new ()
                {
                    ParticipantId = conference.Participants[0].RefId,
                    ParticipantUsername = conference.Participants[0].Username,
                    LinkedParticipantType = LinkedParticipantTypeV2.DefenceAdvocate
                },
                new ()
                {
                    ParticipantId = conference.Participants[1].RefId,
                    ParticipantUsername = conference.Participants[1].Username,
                    LinkedParticipantType = LinkedParticipantTypeV2.Representative
                },
                new ()
                {
                    ParticipantId = conference.Participants[2].RefId,
                    ParticipantUsername = conference.Participants[2].Username,
                    LinkedParticipantType = LinkedParticipantTypeV2.Intermediary
                }
                
            };
            var endpoints = conference.Endpoints.Select(x => new EndpointResponseV2()
            {
                Id = x.Id,
                DisplayName = x.DisplayName,
                Sip = x.SipAddress,
                Pin = x.Pin,
                EndpointParticipants = endpointParticipants
            }).ToList();
            
            return Builder<HearingDetailsResponseV2>.CreateNew()
                .With(x => x.Id = conference.HearingId)
                .With(x => x.Endpoints = endpoints)
                .Build();
        }
        
        private static ConferenceDetailsResponse BuildConferenceDetailsResponse()
        {
            var participants = new List<ParticipantDetailsResponse>
            {
                new ParticipantDetailsResponseBuilder(UserRole.Individual, "Claimant").WithHearingRole("Litigant in person").Build(),
                new ParticipantDetailsResponseBuilder(UserRole.Individual, "Defendant").WithHearingRole("Litigant in person").Build(),
                new ParticipantDetailsResponseBuilder(UserRole.Representative, "Defendant").WithHearingRole("Professional").Build(),
                new ParticipantDetailsResponseBuilder(UserRole.Judge, "None").WithHearingRole("Judge").Build(),
                new ParticipantDetailsResponseBuilder(UserRole.CaseAdmin, "None").Build(),
                new ParticipantDetailsResponseBuilder(UserRole.Individual, "Claimant").WithHearingRole("Witness").Build()
            };
            var participantA = participants[0];
            var participantB = participants[1];
            participantA.LinkedParticipants.Add(new LinkedParticipantResponse { LinkedId = participantB.Id, Type = LinkedParticipantType.Interpreter });
            participantB.LinkedParticipants.Add(new LinkedParticipantResponse { LinkedId = participantA.Id, Type = LinkedParticipantType.Interpreter });
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
