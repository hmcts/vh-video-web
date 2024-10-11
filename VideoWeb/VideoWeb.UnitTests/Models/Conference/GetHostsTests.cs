using System;
using FizzWare.NBuilder;
using FluentAssertions;
using NUnit.Framework;
using VideoWeb.Common.Models;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.Models.Conference;

public class GetHostsTests
{
    [Test]
    public void should_return_hosts()
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
        
        // Screening pair 1 - participant-participant
        
        var participantToScreenFrom = Builder<Participant>.CreateNew()
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
            .With(x => x.ProtectFrom = [participantToScreenFrom.ExternalReferenceId])
            .Build();
        
        // Screening pair 2 - participant-endpoint
        
        var participantToScreenFrom2 = Builder<Participant>.CreateNew()
            .With(x => x.Role = Role.Individual)
            .With(x => x.Id = Guid.NewGuid())
            .With(x => x.Username = Faker.Internet.Email())
            .With(x => x.ExternalReferenceId = Guid.NewGuid().ToString())
            .Build();

        var endpointToScreen = Builder<Endpoint>.CreateNew()
            .With(x => x.Id = Guid.NewGuid())
            .With(x => x.DisplayName = "EP2")
            .With(x => x.ExternalReferenceId = Guid.NewGuid().ToString())
            .With(x => x.ProtectFrom = [participantToScreenFrom2.ExternalReferenceId])
            .Build();
        
        // Screening pair 3 - endpoint-participant
        
        var endpointToScreenFrom1 = Builder<Endpoint>.CreateNew()
            .With(x => x.Id = Guid.NewGuid())
            .With(x => x.DisplayName = "EP3")
            .With(x => x.ExternalReferenceId = Guid.NewGuid().ToString())
            .Build();
        
        var participantToScreen2 = Builder<Participant>.CreateNew()
            .With(x => x.Role = Role.Individual)
            .With(x => x.Id = Guid.NewGuid())
            .With(x => x.Username = Faker.Internet.Email())
            .With(x => x.ExternalReferenceId = Guid.NewGuid().ToString())
            .With(x => x.ProtectFrom = [endpointToScreenFrom1.ExternalReferenceId])
            .Build();
        
        // Screening pair 4 - endpoint-endpoint
        
        var endpointToScreenFrom2 = Builder<Endpoint>.CreateNew()
            .With(x => x.Id = Guid.NewGuid())
            .With(x => x.DisplayName = "EP4")
            .With(x => x.ExternalReferenceId = Guid.NewGuid().ToString())
            .Build();
        
        var endpointToScreen2 = Builder<Endpoint>.CreateNew()
            .With(x => x.Id = Guid.NewGuid())
            .With(x => x.DisplayName = "EP5")
            .With(x => x.ExternalReferenceId = Guid.NewGuid().ToString())
            .With(x => x.ProtectFrom = [endpointToScreenFrom2.ExternalReferenceId])
            .Build();

        conference.Participants.AddRange([
            judge, 
            individual, 
            participantToScreenFrom,
            participantToScreenFrom2,
            participantToScreen,
            participantToScreen2]);
        
        conference.Endpoints.AddRange([
            endpoint, 
            endpointToScreenFrom1, 
            endpointToScreenFrom2, 
            endpointToScreen, 
            endpointToScreen2]);
        
        // Act
        var hosts = conference.GetHosts();

        // Assert
        hosts.Should().BeEquivalentTo([judge.Id, individual.Id, endpoint.Id]);
    }
}
