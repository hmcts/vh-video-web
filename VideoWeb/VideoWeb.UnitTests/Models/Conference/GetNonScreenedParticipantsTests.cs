using System;
using FizzWare.NBuilder;
using FluentAssertions;
using NUnit.Framework;
using VideoWeb.Common.Models;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.Models.Conference;

public class GetNonScreenedParticipantsTests
{
    [Test]
    public void should_return_non_screened_participants()
    {
        // Arrange
        var conference = new ConferenceCacheModelBuilder()
            .Build();
        conference.Participants.Clear();
        conference.Endpoints.Clear();

        var judge = Builder<Participant>.CreateNew()
            .With(x => x.Role = Role.Judge)
            .With(x => x.Id = Guid.NewGuid())
            .With(x => x.Username = Faker.Internet.Email())
            .Build();

        var individual = Builder<Participant>.CreateNew()
            .With(x => x.Role = Role.Individual)
            .With(x => x.Id = Guid.NewGuid())
            .With(x => x.Username = Faker.Internet.Email())
            .Build();
        
        var endpoint = Builder<Endpoint>.CreateNew()
            .With(x => x.Id = Guid.NewGuid())
            .With(x => x.DisplayName = "EP1")
            .Build();
 
        // Screening pair 1
        
        var participantToScreenFrom1 = Builder<Participant>.CreateNew()
            .With(x => x.Role = Role.Individual)
            .With(x => x.Id = Guid.NewGuid())
            .With(x => x.Username = Faker.Internet.Email())
            .With(x => x.ExternalReferenceId = Guid.NewGuid().ToString())
            .Build();

        var participantToScreen = Builder<Participant>.CreateNew()
            .With(x => x.Role = Role.Individual)
            .With(x => x.Id = Guid.NewGuid())
            .With(x => x.Username = Faker.Internet.Email())
            .With(x => x.ExternalReferenceId = Guid.NewGuid().ToString())
            .With(x => x.ProtectFrom = [participantToScreenFrom1.ExternalReferenceId])
            .Build();
        
        // Screening pair 2
        
        var participantToScreenFrom2 = Builder<Participant>.CreateNew()
            .With(x => x.Role = Role.Individual)
            .With(x => x.Id = Guid.NewGuid())
            .With(x => x.Username = Faker.Internet.Email())
            .With(x => x.ExternalReferenceId = Guid.NewGuid().ToString())
            .Build();

        var endpointToScreen = Builder<Endpoint>.CreateNew()
            .With(x => x.Id = Guid.NewGuid())
            .With(x => x.DisplayName = "EP1")
            .With(x => x.ExternalReferenceId = Guid.NewGuid().ToString())
            .With(x => x.ProtectFrom = [participantToScreenFrom2.ExternalReferenceId])
            .Build();
        
        conference.Participants.AddRange([
            judge, 
            individual, 
            participantToScreenFrom1, 
            participantToScreen,
            participantToScreenFrom2]);
        
        conference.Endpoints.AddRange([endpoint, endpointToScreen]);

        // Act
        var result = conference.GetNonScreenedParticipants();
        
        // Assert
        result.Should().BeEquivalentTo([judge, individual]);
    }
}
