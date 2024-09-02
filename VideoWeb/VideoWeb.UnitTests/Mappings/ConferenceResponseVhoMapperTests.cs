using System;
using System.Collections.Generic;
using FizzWare.NBuilder;
using FluentAssertions;
using NUnit.Framework;
using VideoWeb.Common.Models;
using VideoWeb.Mappings;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.Mappings;

public class ConferenceResponseVhoMapperTests
{
    [Test]
    public void Should_map_all_properties()
    {
        var participants = new List<Participant>
        {
            new ParticipantBuilder(Role.Individual).Build(),
            new ParticipantBuilder(Role.Individual).Build(),
            new ParticipantBuilder(Role.Representative).Build(),
            new ParticipantBuilder(Role.Judge).Build(),
            new ParticipantBuilder(Role.CaseAdmin).Build()
        };

        var expectedConferenceStatus = ConferenceStatus.Suspended;
        
        var meetingRoom = Builder<ConferenceMeetingRoom>.CreateNew().Build();
        
        var conference = Builder<Conference>.CreateNew()
            .With(x => x.CurrentStatus = ConferenceStatus.Suspended)
            .With(x => x.Participants = participants)
            .With(x => x.MeetingRoom = meetingRoom)
            .Build();
        
        var response = ConferenceResponseVhoMapper.Map(conference);
        
        response.Id.Should().Be(conference.Id);
        response.CaseName.Should().Be(conference.CaseName);
        response.CaseType.Should().Be(conference.CaseType);
        response.CaseNumber.Should().Be(conference.CaseNumber);
        response.ScheduledDateTime.Should().Be(conference.ScheduledDateTime);
        response.ScheduledDuration.Should().Be(conference.ScheduledDuration);
        response.Status.Should().Be(expectedConferenceStatus);
        
        var participantsResponse = response.Participants;
        participantsResponse.Should().NotBeNullOrEmpty();
        foreach (var Participant in participantsResponse)
        {
            if (Participant.Role == Role.Representative || Participant.Role == Role.Individual)
            {
                (Participant.TiledDisplayName.StartsWith("T1")
                 || Participant.TiledDisplayName.StartsWith("T2")
                 || Participant.TiledDisplayName.StartsWith("T3")
                 || Participant.TiledDisplayName.StartsWith("T4"))
                    .Should().BeTrue();
            }
            if (Participant.Role == Role.Judge)
            {
                Participant.TiledDisplayName.StartsWith("T0").Should().BeTrue();
            }
            if (Participant.Role == Role.CaseAdmin)
            {
                Participant.TiledDisplayName.Should().BeNull();
            }
        }
        
        response.AdminIFrameUri.Should().Be(meetingRoom.AdminUri);
        response.ParticipantUri.Should().Be(meetingRoom.ParticipantUri);
        response.PexipNodeUri.Should().Be(meetingRoom.PexipNode);
    }
    
    [Test]
    public void Should_map_all_properties_with_empty_participants_list()
    {
        var participants = new List<Participant>();
        var expectedConferenceStatus = ConferenceStatus.Suspended;
        var meetingRoom = Builder<ConferenceMeetingRoom>.CreateNew().Build();
        var conference = Builder<Conference>.CreateNew()
            .With(x => x.CurrentStatus = ConferenceStatus.Suspended)
            .With(x => x.Participants = participants)
            .With(x => x.MeetingRoom = meetingRoom)
            .Build();
        
        var response = ConferenceResponseVhoMapper.Map(conference);
        
        response.Id.Should().Be(conference.Id);
        response.CaseName.Should().Be(conference.CaseName);
        response.CaseType.Should().Be(conference.CaseType);
        response.CaseNumber.Should().Be(conference.CaseNumber);
        response.ScheduledDateTime.Should().Be(conference.ScheduledDateTime);
        response.ScheduledDuration.Should().Be(conference.ScheduledDuration);
        response.Status.Should().Be(expectedConferenceStatus);
        
        response.AdminIFrameUri.Should().Be(meetingRoom.AdminUri);
        response.ParticipantUri.Should().Be(meetingRoom.ParticipantUri);
        response.PexipNodeUri.Should().Be(meetingRoom.PexipNode);
    }
    
    [Test]
    public void Maps_Hearing_Id_From_Conference()
    {
        var conference = Builder<Conference>.CreateNew().Build();
        
        var response = ConferenceResponseVhoMapper.Map(conference);
        
        response.HearingId.Should().Be(conference.HearingId);
    }
    
    [Test]
    public void Should_map_all_properties_with_participants_list_null()
    {
        var expectedConferenceStatus = ConferenceStatus.Suspended;
        
        var meetingRoom = Builder<ConferenceMeetingRoom>.CreateNew().Build();
        
        var conference = Builder<Conference>.CreateNew()
            .With(x => x.CurrentStatus = ConferenceStatus.Suspended)
            .With(x => x.Participants = null)
            .With(x => x.MeetingRoom = meetingRoom)
            .Build();
        
        var response = ConferenceResponseVhoMapper.Map(conference);
        
        response.Id.Should().Be(conference.Id);
        response.CaseName.Should().Be(conference.CaseName);
        response.CaseType.Should().Be(conference.CaseType);
        response.CaseNumber.Should().Be(conference.CaseNumber);
        response.ScheduledDateTime.Should().Be(conference.ScheduledDateTime);
        response.ScheduledDuration.Should().Be(conference.ScheduledDuration);
        response.Status.Should().Be(expectedConferenceStatus);
        
        response.AdminIFrameUri.Should().Be(meetingRoom.AdminUri);
        response.ParticipantUri.Should().Be(meetingRoom.ParticipantUri);
        response.PexipNodeUri.Should().Be(meetingRoom.PexipNode);
    }
    
    [Test]
    public void Should_map_if_have_not_booking_participants_with_the_same_id()
    {
        var participants = new List<Participant>
        {
            new ParticipantBuilder(Role.Individual).Build(),
            new ParticipantBuilder(Role.Individual).Build(),
            new ParticipantBuilder(Role.Representative).Build(),
            new ParticipantBuilder(Role.Judge).Build(),
            new ParticipantBuilder(Role.CaseAdmin).Build()
        };
        
        participants[0].RefId = Guid.NewGuid();
        participants[1].RefId = Guid.NewGuid();
        participants[2].RefId = Guid.NewGuid();
        participants[3].RefId = Guid.NewGuid();
        participants[4].RefId = Guid.NewGuid();
        
        
        var meetingRoom = Builder<ConferenceMeetingRoom>.CreateNew().Build();
        
        var conference = Builder<Conference>.CreateNew()
            .With(x => x.CurrentStatus = ConferenceStatus.Suspended)
            .With(x => x.Participants = participants)
            .With(x => x.MeetingRoom = meetingRoom)
            .Build();
        
        var response = ConferenceResponseVhoMapper.Map(conference);
        
        response.Id.Should().Be(conference.Id);
        response.CaseName.Should().Be(conference.CaseName);
        response.CaseType.Should().Be(conference.CaseType);
        response.CaseNumber.Should().Be(conference.CaseNumber);
        response.ScheduledDateTime.Should().Be(conference.ScheduledDateTime);
        response.ScheduledDuration.Should().Be(conference.ScheduledDuration);
        
        response.AdminIFrameUri.Should().Be(meetingRoom.AdminUri);
        response.ParticipantUri.Should().Be(meetingRoom.ParticipantUri);
        response.PexipNodeUri.Should().Be(meetingRoom.PexipNode);
    }
}
