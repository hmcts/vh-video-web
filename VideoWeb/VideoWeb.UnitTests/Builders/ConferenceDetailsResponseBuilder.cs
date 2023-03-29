using System;
using System.Collections.Generic;
using System.Linq;
using FizzWare.NBuilder;
using VideoApi.Contract.Enums;
using VideoApi.Contract.Responses;

namespace VideoWeb.UnitTests.Builders;

public static class ConferenceDetailsResponseBuilder
{
    public static ConferenceDetailsResponse CreateValidConferenceResponse(string username = "john@hmcts.net")
    {
        var judge = new ParticipantDetailsResponseBuilder(UserRole.Judge, "Judge").Build();
        var staffMember = new ParticipantDetailsResponseBuilder(UserRole.StaffMember, "StaffMember").Build();
        var individualDefendant = new ParticipantDetailsResponseBuilder(UserRole.Individual, "Defendant").Build();
        var individualClaimant = new ParticipantDetailsResponseBuilder(UserRole.Individual, "Claimant").Build();
        var repClaimant = new ParticipantDetailsResponseBuilder(UserRole.Representative, "Claimant").Build();
        var panelMember =
            new ParticipantDetailsResponseBuilder(UserRole.JudicialOfficeHolder, "Panel Member").Build();
        var participants = new List<ParticipantDetailsResponse>()
        {
            individualDefendant, individualClaimant, repClaimant, judge, panelMember, staffMember
        };
        var endpoints = Builder<EndpointResponse>.CreateListOfSize(2).Build().ToList();
        if (!string.IsNullOrWhiteSpace(username))
        {
            participants.First().Username = username;
        }

        var conference = Builder<ConferenceDetailsResponse>.CreateNew()
            .With(x=> x.Id, Guid.NewGuid())
            .With(x=> x.HearingId, Guid.NewGuid())
            .With(x=> x.ScheduledDateTime, DateTime.Today.AddHours(10).AddMinutes(45))
            .With(x => x.ScheduledDuration, 40)
            .With(x => x.Participants, participants)
            .With(x => x.Endpoints, endpoints)
            .Build();
        return conference;
    }
        
}
