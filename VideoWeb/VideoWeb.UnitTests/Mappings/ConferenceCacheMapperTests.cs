using System.Collections.Generic;
using System.Linq;
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
    //TODO: Add individual participant (judicial and quicklink) mappers
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
            
            foreach (var resultParticipant in response.Participants)
            {
                var participant = conference.Participants.Single(x => x.Id == resultParticipant.Id);
                var participantDetails = hearingResponse.Participants.Single(x => x.Id == resultParticipant.RefId);
                
                resultParticipant.Id.Should().Be(participant.Id);
                resultParticipant.Username.Should().Be(participantDetails.Username);
                resultParticipant.Role.Should().Be((Role)participant.UserRole);
                resultParticipant.HearingRole.Should().Be(participantDetails.HearingRoleName);
                resultParticipant.DisplayName.Should().Be(participantDetails.DisplayName);
                resultParticipant.FirstName.Should().Be(participantDetails.FirstName);
                resultParticipant.LastName.Should().Be(participantDetails.LastName);
                resultParticipant.ContactEmail.Should().Be(participantDetails.ContactEmail);
                resultParticipant.ContactTelephone.Should().Be(participantDetails.TelephoneNumber);
                resultParticipant.Representee.Should().Be(participantDetails.Representee);
                
                resultParticipant.CurrentRoom.Should().NotBeNull();
                resultParticipant.CurrentRoom.Label.Should().Be(participant.CurrentRoom.Label);
                resultParticipant.CurrentRoom.Locked.Should().Be(participant.CurrentRoom.Locked);
                
                resultParticipant.LinkedParticipants.Count.Should().Be(participant.LinkedParticipants.Count);
                resultParticipant.LinkedParticipants[0].LinkType.ToString().Should().Be(participant.LinkedParticipants[0].Type.ToString());
                resultParticipant.LinkedParticipants[0].LinkedId.Should().Be(participant.LinkedParticipants[0].LinkedId);
            }
            
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
                conference.Endpoints.Select(x => x.DefenceAdvocate).Should().Contain(endpoint.DefenceAdvocate);
            }
        }
        
        private HearingDetailsResponseV2 BuildHearingDetailsResponse(ConferenceDetailsResponse conference)
        {
            var participants = new List<ParticipantResponseV2>();
            
            foreach (var participant in conference.Participants)
                participants.Add(new ParticipantFromBookingApiResponseBuilder(participant.RefId)
                    .WithRoles(participant.UserRole.ToString())
                    .Build());
            
            var endpoints = conference.Endpoints.Select(x => new EndpointResponseV2
            {
                Id = conference.HearingId,
                DisplayName = x.DisplayName,
                Sip = x.SipAddress,
                Pin = x.Pin,
                DefenceAdvocateId = conference.Participants.First(p => p.Username == x.DefenceAdvocate).RefId,
            }).ToList();
            
            return Builder<HearingDetailsResponseV2>.CreateNew()
                .With(x => x.Id = conference.HearingId)
                .With(x => x.Endpoints = endpoints)
                .With(x => x.Participants = participants)
                .Build();
        }
        
        
        [Test]
        public void Should_map_without_current_room()
        {
            var conference = BuildConferenceDetailsResponse();
            conference.Participants[0].CurrentRoom = null;
            var response = ConferenceCacheMapper.MapConferenceToCacheModel(conference);
            
            var resultParticipant  = response.Participants[0];
            
            resultParticipant.CurrentRoom.Should().BeNull();
        }

        private static ConferenceDetailsResponse BuildConferenceDetailsResponse()
        {
            var participants = new List<ParticipantResponse>
            {
                new ParticipantResponseBuilder(UserRole.Individual).Build(),
                new ParticipantResponseBuilder(UserRole.Individual).Build(),
                new ParticipantResponseBuilder(UserRole.Representative).Build(),
                new ParticipantResponseBuilder(UserRole.Judge).Build(),
                new ParticipantResponseBuilder(UserRole.CaseAdmin).Build(),
                new ParticipantResponseBuilder(UserRole.Individual).Build()
            };
            var participantA = participants[0];
            var participantB = participants[1];
            participantA.LinkedParticipants.Add(new LinkedParticipantResponse { LinkedId = participantB.Id, Type = LinkedParticipantType.Interpreter});
           
            participantA.CurrentRoom = new RoomResponse            {Id = 1,Label = "Room 1", Locked = true};

            participantB.LinkedParticipants.Add(new LinkedParticipantResponse { LinkedId = participantA.Id, Type = LinkedParticipantType.Interpreter });
            var endpoints = Builder<EndpointResponse>.CreateListOfSize(2).All().With(e => e.DefenceAdvocate = participantA.Username).Build().ToList();
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
