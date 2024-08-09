using System;
using System.Collections.Generic;
using System.Linq;
using FizzWare.NBuilder;
using FluentAssertions;
using NUnit.Framework;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoApi.Contract.Responses;
using VideoApi.Contract.Enums;
using VideoWeb.Mappings;

namespace VideoWeb.UnitTests.Mappings;

public class ParticipantStatusResponseForVhoMapperTests
{
    
    [Test]
    public void Should_map_all_properties()
    {
        var conferenceId = Guid.NewGuid();
        var conference = CreateValidConference(conferenceId);
        
        var judge1 = CreateParticipant("judge1");
        var judge2 = CreateParticipant("judge2");
        var judge3 = CreateParticipant("judge3");
        var judge4 = CreateParticipant("judge4");
        var judge2DifferentHearing = CreateParticipant("judge2");
        var judge3DifferentHearing = CreateParticipant("judge3");
        var judge4DifferentHearing = CreateParticipant("judge4");
        conference.Participants = [judge1, judge2, judge3, judge4];
        
        var judgesInHearings = new List<ParticipantInHearingResponse>
        {
            new () {Id = judge2DifferentHearing.Id, Username = judge2.Username, Status = ParticipantState.InHearing},
            new () {Id = judge3DifferentHearing.Id, Username = judge3.Username, Status = ParticipantState.InConsultation},
            new () {Id = judge4DifferentHearing.Id, Username = judge4.Username, Status = ParticipantState.Available}
        };
        
        var results = ParticipantStatusResponseForVhoMapper.Map(conference, judgesInHearings).ToList();
        
        AssertResponseItem(results.ElementAt(0), conference.Participants[0], conferenceId, false);
        AssertResponseItem(results.ElementAt(1), conference.Participants[1], conferenceId, true);
        AssertResponseItem(results.ElementAt(2), conference.Participants[2], conferenceId, true);
        AssertResponseItem(results.ElementAt(3), conference.Participants[3], conferenceId, true);
    }
    
    [Test]
    public void Should_map_all_properties_with_not_matching_booking_participants()
    {
        var conferenceId = Guid.NewGuid();
        var conference = CreateValidConference(conferenceId);
        
        var judge1 = CreateParticipant("judge1");
        var judge2 = CreateParticipant("judge2");
        var judge3 = CreateParticipant("judge3");
        var judge3DifferentHearing = CreateParticipant("judge3");
        conference.Participants = new List<Participant>
        {
            judge1, judge2, judge3
        };
        
        var hostsInHearings = new List<ParticipantInHearingResponse>
        {
            new () { Id = judge3DifferentHearing.Id, Username = judge3.Username, Status = ParticipantState.InHearing }
        };
        
        var results = ParticipantStatusResponseForVhoMapper.Map(conference, hostsInHearings).ToList();
        
        AssertResponseItem(results.ElementAt(0), conference.Participants[0], conferenceId, false);
    }
    
    private static void AssertResponseItem(ParticipantContactDetailsResponseVho response, Participant participant,
        Guid conferenceId, bool isInAnotherHearing)
    {
        response.Id.Should().Be(participant.Id);
        response.ConferenceId.Should().Be(conferenceId);
        response.Role.Should().Be(participant.Role);
        response.HearingRole.Should().Be(participant.HearingRole);
        response.Username.Should().Be(participant.Username);
        response.RefId.Should().Be(participant.RefId);
        response.FirstName.Should().Be(participant.FirstName);
        response.LastName.Should().Be(participant.LastName);
        response.DisplayName.Should().Be(participant.DisplayName);
        response.Status.Should().Be(participant.ParticipantStatus);
        response.ContactEmail.Should().Be(participant.ContactEmail);
        response.ContactTelephone.Should().Be(participant.ContactTelephone);
        response.HearingVenueName.Should().Be("MyVenue");
        response.HostInAnotherHearing.Should().Be(isInAnotherHearing);
        response.Representee.Should().Be(participant.Representee);
    }
    
    private static Participant CreateParticipant(string username)
    {
        return Builder<Participant>.CreateNew()
            .With(x => x.Id = Guid.NewGuid())
            .With(x => x.Role = Role.Judge)
            .With(x => x.Username = username)
            .With(x => x.ParticipantStatus == ParticipantStatus.Available)
            .With(x => x.RefId = Guid.NewGuid())
            .With(x=> x.LinkedParticipants = new List<LinkedParticipant>())
            .With(x => x.DisplayName = $"{username} {username}")
            .Build();
    }
    
    private static Conference CreateValidConference(Guid conferenceId)
    {
        var conference = Builder<Conference>.CreateNew()
            .With(x => x.Id = conferenceId)
            .With(x => x.HearingId = Guid.NewGuid())
            .With(x => x.HearingVenueName = "MyVenue")
            .Build();
        
        return conference;
    }
}
