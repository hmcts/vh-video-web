using System;
using System.Collections.Generic;
using FizzWare.NBuilder;
using FluentAssertions;
using NUnit.Framework;
using Conference = VideoApi.Contract.Responses.ConferenceForIndividualResponse;
using VideoApi.Contract.Enums;
using VideoApi.Contract.Responses;
using VideoWeb.Common.Models;
using VideoWeb.Mappings;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.Mappings;

public class ConferenceForIndividualResponseMapperTests
{
    [Test]
    public void Should_map_all_properties()
    {
        const string loggedInUsername = "test@user.com";
        
        var participants = new List<ParticipantResponse>
        {
            new ParticipantResponseBuilder(UserRole.Individual).WithStatus(ParticipantState.Available).Build(),
            new ParticipantResponseBuilder(UserRole.Representative).WithStatus(ParticipantState.Disconnected).Build(),
            new ParticipantResponseBuilder(UserRole.Judge).WithStatus(ParticipantState.NotSignedIn).Build()
        };
        participants[0].Username = loggedInUsername;
        
        var conference = Builder<Conference>.CreateNew()
            .With(x => x.Id = Guid.NewGuid())
            .Build();
        
        var response = ConferenceForIndividualResponseMapper.Map(conference);
        
        response.Id.Should().Be(conference.Id);
        response.ScheduledDateTime.Should().Be(conference.ScheduledDateTime);
        response.CaseNumber.Should().Be(conference.CaseNumber);
        response.CaseName.Should().Be(conference.CaseName);
        response.Status.Should().Be((ConferenceStatus)conference.Status);
        response.ClosedDateTime.Should().Be(conference.ClosedDateTime);
    }
}
