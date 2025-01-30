using System;
using System.Collections.Generic;
using System.Linq;
using Bogus;
using FizzWare.NBuilder;
using VideoApi.Contract.Enums;
using VideoApi.Contract.Responses;

namespace VideoWeb.UnitTests.Builders;

public static class ConferenceDetailsResponseBuilder
{
    public static List<ConferenceDetailsResponse> BuildConferenceDetailsResponseList(int count)
    {
        Faker faker = new();
        var participants = Builder<ParticipantResponse>.CreateListOfSize(4)
            .All()
            .With(x => x.Username = faker.Internet.Email())
            .With(x => x.LinkedParticipants = new List<LinkedParticipantResponse>())
            .TheFirst(1).With(x => x.UserRole = UserRole.Judge)
            .TheRest().With(x => x.UserRole = UserRole.Individual).Build().ToList();
            
        var conferences = Builder<ConferenceDetailsResponse>.CreateListOfSize(count).All()
            .With(x => x.Participants = participants)
            .With((x, i) => x.CaseName = $"Test case name {i+1}")
            .With(x => x.ScheduledDateTime = DateTime.UtcNow.AddMinutes(-60))
            .With(x => x.ScheduledDuration = 20)
            .With(x => x.CurrentStatus = ConferenceState.NotStarted)
            .With(x => x.ClosedDateTime = null)
            .With(x => x.IsWaitingRoomOpen = true)
            .Build().ToList();

        return conferences;
    }
}
