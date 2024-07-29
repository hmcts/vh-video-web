using System;
using System.Collections.Generic;
using FizzWare.NBuilder;
using FluentAssertions;
using NUnit.Framework;
using VideoApi.Contract.Enums;
using VideoWeb.Mappings;
using Conference = VideoApi.Contract.Responses.ConferenceForHostResponse;
using Participant = VideoApi.Contract.Responses.ParticipantForHostResponse;

namespace VideoWeb.UnitTests.Mappings;

public class ConferenceForHostResponseMapperTests
{
    
    [Test]
    public void Should_map_all_properties()
    {
        Builder<Participant>.CreateNew().With(x => x.Role = UserRole.Individual).Build();
        var participants = new List<Participant>
        {
            Builder<Participant>.CreateNew().With(x => x.Role = UserRole.Individual).Build(),
            Builder<Participant>.CreateNew().With(x => x.Role = UserRole.Representative).Build(),
            Builder<Participant>.CreateNew().With(x => x.Role = UserRole.Judge).Build()
        };
        
        var conference = Builder<Conference>.CreateNew()
            .With(x => x.Id = Guid.NewGuid())
            .With(x => x.Participants = participants)
            .With(x => x.NumberOfEndpoints = 2)
            .With(x => x.ClosedDateTime = DateTime.UtcNow.AddMinutes(-10))
            .With(x => x.HearingVenueIsScottish = true)
            .Build();
        
        var response = ConferenceForHostResponseMapper.Map(conference);
        
        response.Id.Should().Be(conference.Id);
        response.ScheduledDateTime.Should().Be(conference.ScheduledDateTime);
        response.ClosedDateTime.Should().HaveValue().And.Be(conference.ClosedDateTime);
        response.ScheduledDuration.Should().Be(conference.ScheduledDuration);
        response.CaseType.Should().Be(conference.CaseType);
        response.CaseNumber.Should().Be(conference.CaseNumber);
        response.CaseName.Should().Be(conference.CaseName);
        response.Status.ToString().Should().Be(conference.Status.ToString());
        response.Participants.Count.Should().Be(participants.Count);
        response.NumberOfEndpoints.Should().Be(conference.NumberOfEndpoints);
        response.HearingVenueIsScottish.Should().Be(conference.HearingVenueIsScottish);
    }
}
