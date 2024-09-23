using System;
using System.Collections.Generic;
using System.Linq;
using BookingsApi.Contract.V1.Responses;
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
using EndpointResponse = VideoApi.Contract.Responses.EndpointResponse;
using InterpreterType = BookingsApi.Contract.V1.Enums.InterpreterType;
using LinkedParticipantResponse = VideoApi.Contract.Responses.LinkedParticipantResponse;
using ParticipantResponse = VideoApi.Contract.Responses.ParticipantResponse;
using Supplier = VideoWeb.Common.Enums.Supplier;

namespace VideoWeb.UnitTests.Mappings;

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
        response.Supplier.Should().Be((Supplier)hearingResponse.BookingSupplier);
        
        response.HearingVenueName.Should().Be(hearingResponse.HearingVenueName);
        response.CaseName.Should().Be(hearingResponse.Cases[0].Name);
        response.CaseNumber.Should().Be(hearingResponse.Cases[0].Number);
        response.Participants.Count.Should().Be(conference.Participants.Count);
        
        foreach (var resultParticipant in response.Participants)
        {
            var participant = conference.Participants.Single(x => x.Id == resultParticipant.Id);
            var participantDetails = hearingResponse.Participants.SingleOrDefault(x => x.Id == resultParticipant.RefId);
            var johDetails = hearingResponse.JudicialOfficeHolders.SingleOrDefault(x => x.Email == resultParticipant.Username);
            if (participantDetails != null)
            {
                resultParticipant.Id.Should().Be(participant.Id);
                resultParticipant.Username.Should().Be(participantDetails.Username);
                resultParticipant.Role.Should().Be((Role)participant.UserRole);
                resultParticipant.HearingRole.Should().Be(participantDetails.HearingRoleName);
                resultParticipant.DisplayName.Should().Be(participant.DisplayName);
                resultParticipant.FirstName.Should().Be(participantDetails.FirstName);
                resultParticipant.LastName.Should().Be(participantDetails.LastName);
                resultParticipant.ContactEmail.Should().Be(participantDetails.ContactEmail);
                resultParticipant.ContactTelephone.Should().Be(participantDetails.TelephoneNumber);
                resultParticipant.Representee.Should().Be(participantDetails.Representee);
                if (resultParticipant.CurrentRoom != null)
                {
                    resultParticipant.CurrentRoom.Label.Should().Be(participant.CurrentRoom.Label);
                    resultParticipant.CurrentRoom.Locked.Should().Be(participant.CurrentRoom.Locked);
                }
                resultParticipant.InterpreterLanguage.Should().BeEquivalentTo(participantDetails.InterpreterLanguage.Map());
                resultParticipant.LinkedParticipants.Count.Should().Be(participant.LinkedParticipants.Count);
                resultParticipant.LinkedParticipants[0].LinkType.ToString().Should().Be(participant.LinkedParticipants[0].Type.ToString());
                resultParticipant.LinkedParticipants[0].LinkedId.Should().Be(participant.LinkedParticipants[0].LinkedId);
            }
            else if (johDetails != null)
            {
                resultParticipant.Id.Should().Be(participant.Id);
                resultParticipant.Username.Should().Be(johDetails.Email);
                resultParticipant.Role.Should().Be((Role)participant.UserRole);
                resultParticipant.HearingRole.Should().Be(johDetails.HearingRoleCode.ToString());
                resultParticipant.DisplayName.Should().Be(participant.DisplayName);
                resultParticipant.FirstName.Should().Be(johDetails.FirstName);
                resultParticipant.LastName.Should().Be(johDetails.LastName);
                resultParticipant.ContactEmail.Should().Be(johDetails.OptionalContactEmail);
                resultParticipant.ContactTelephone.Should().Be(johDetails.OptionalContactTelephone);
                resultParticipant.InterpreterLanguage.Should().BeEquivalentTo(johDetails.InterpreterLanguage.Map());
            }
            else
            {
                resultParticipant.Id.Should().Be(participant.Id);
                resultParticipant.Role.Should().Be((Role)participant.UserRole);
                resultParticipant.DisplayName.Should().Be(participant.DisplayName);
                if (resultParticipant.CurrentRoom != null)
                {
                    resultParticipant.CurrentRoom.Label.Should().Be(participant.CurrentRoom.Label);
                    resultParticipant.CurrentRoom.Locked.Should().Be(participant.CurrentRoom.Locked);
                }
            }
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
            conference.Endpoints.Select(x => x.DefenceAdvocate).Should().Contain(endpoint.DefenceAdvocateUsername);
            var hearingEndpoint = hearingResponse.Endpoints.Find(e => e.Id == endpoint.Id);
            endpoint.InterpreterLanguage.Should().BeEquivalentTo(hearingEndpoint.InterpreterLanguage.Map());
        }
    }
    
    
    [Test]
    public void Should_map_without_current_room()
    {
        var conference = BuildConferenceDetailsResponse();
        var hearing = BuildHearingDetailsResponse(conference);
        conference.Participants[0].CurrentRoom = null;
        var response = ConferenceCacheMapper.MapConferenceToCacheModel(conference, hearing);
        
        var resultParticipant  = response.Participants[0];
        
        resultParticipant.CurrentRoom.Should().BeNull();
    }

    [Test]
    public void Should_map_without_interpreter_language()
    {
        var conference = BuildConferenceDetailsResponse();
        var hearing = BuildHearingDetailsResponse(conference);
        var participant = hearing.Participants[0];
        participant.InterpreterLanguage = null;
        var judiciaryParticipant = hearing.JudicialOfficeHolders[0];
        judiciaryParticipant.InterpreterLanguage = null;
        var endpoint = hearing.Endpoints[0];
        endpoint.InterpreterLanguage = null;
        
        var response = ConferenceCacheMapper.MapConferenceToCacheModel(conference, hearing);
        
        var resultParticipant  = response.Participants.Find(p => p.Username == participant.Username);
        resultParticipant.InterpreterLanguage.Should().BeNull();
        var resultJudiciaryParticipant = response.Participants.Find(p => p.Username == judiciaryParticipant.Email);
        resultJudiciaryParticipant.InterpreterLanguage.Should().BeNull();
        var resultEndpoint = response.Endpoints.Find(e => e.Id == endpoint.Id);
        resultEndpoint.InterpreterLanguage.Should().BeNull();
    }
    
    private HearingDetailsResponseV2 BuildHearingDetailsResponse(ConferenceDetailsResponse conference)
    {
        var participants = new List<ParticipantResponseV2>();
        var joh = new List<JudiciaryParticipantResponse>();
        var interpreterLanguage = new InterpreterLanguagesResponse
        {
            Code = "spa",
            Value = "Spanish",
            Type = InterpreterType.Verbal
        };
        
        foreach (var participant in conference.Participants)
        {
            switch (participant.UserRole)
            {
                case UserRole.Judge:
                case UserRole.JudicialOfficeHolder:
                    joh.Add( new JudicialParticipantResponseBuilder(participant.UserRole == UserRole.Judge)
                        .WithUsername(participant.Username)
                        .WithInterpreterLanguage(interpreterLanguage.Code, interpreterLanguage.Value, interpreterLanguage.Type)
                        .Build());
                    break;
                case UserRole.QuickLinkObserver:
                case UserRole.QuickLinkParticipant:
                    continue;
                default:
                    participants.Add(new ParticipantFromBookingApiResponseBuilder(participant.RefId)
                        .WithRoles(participant.UserRole.ToString())
                        .WithInterpreterLanguage(interpreterLanguage.Code, interpreterLanguage.Value, interpreterLanguage.Type)
                        .WithUsername(participant.Username)
                        .Build());
                    break;
            }
        }
        
        var endpoints = conference.Endpoints.Select(x => new EndpointResponseV2
        {
            Id = x.Id,
            DisplayName = x.DisplayName,
            Sip = x.SipAddress,
            Pin = x.Pin,
            DefenceAdvocateId = conference.Participants.First(p => p.Username == x.DefenceAdvocate).RefId,
            InterpreterLanguage = interpreterLanguage
        }).ToList();
        
        return Builder<HearingDetailsResponseV2>.CreateNew()
            .With(x => x.Id = conference.HearingId)
            .With(x => x.Endpoints = endpoints)
            .With(x => x.Participants = participants)
            .With(x => x.JudicialOfficeHolders = joh)
            .With(x => x.BookingSupplier = BookingSupplier.Vodafone)
            .With(x => x.HearingVenueName = "Venue")
            .With(x => x.Cases = Builder<CaseResponseV2>.CreateListOfSize(1).Build().ToList())
            .Build();
    }
    
    private static ConferenceDetailsResponse BuildConferenceDetailsResponse()
    {
        var participants = new List<ParticipantResponse>
        {
            new ParticipantResponseBuilder(UserRole.Individual).WithUsername(Faker.Internet.Email()).Build(),
            new ParticipantResponseBuilder(UserRole.Individual).WithUsername(Faker.Internet.Email()).Build(),
            new ParticipantResponseBuilder(UserRole.Representative).WithUsername(Faker.Internet.Email()).Build(),
            new ParticipantResponseBuilder(UserRole.Judge).WithUsername("Judge1").Build(),
            new ParticipantResponseBuilder(UserRole.JudicialOfficeHolder).WithUsername("Joh1").Build(),
            new ParticipantResponseBuilder(UserRole.CaseAdmin).WithUsername(Faker.Internet.Email()).Build(),
            new ParticipantResponseBuilder(UserRole.QuickLinkParticipant).WithUsername(Faker.Internet.Email()).Build()
        };
        var participantA = participants[0];
        var participantB = participants[1];
        participantA.LinkedParticipants.Add(new LinkedParticipantResponse { LinkedId = participantB.Id, Type = LinkedParticipantType.Interpreter});
        participantA.CurrentRoom = new RoomResponse {Id = 1,Label = "Room 1", Locked = true};
        participantB.LinkedParticipants.Add(new LinkedParticipantResponse { LinkedId = participantA.Id, Type = LinkedParticipantType.Interpreter });
        participantB.CurrentRoom = new RoomResponse {Id = 2,Label = "Room 2", Locked = true};
        var endpoints = Builder<EndpointResponse>.CreateListOfSize(2)
            .All()
            .With(e => e.DefenceAdvocate = participantA.Username)
            .With(e => e.Id = Guid.NewGuid())
            .Build()
            .ToList();
        var meetingRoom = Builder<MeetingRoomResponse>.CreateNew().Build();
        var conference = Builder<ConferenceDetailsResponse>.CreateNew()
            .With(x => x.CurrentStatus = ConferenceState.Suspended)
            .With(x => x.Participants = participants)
            .With(x => x.MeetingRoom = meetingRoom)
            .With(x => x.CivilianRooms = [new() { Id = 1, Label = "Room 1" }])
            .With(x => x.Endpoints = endpoints)
            .Build();
        return conference;
    }
}
