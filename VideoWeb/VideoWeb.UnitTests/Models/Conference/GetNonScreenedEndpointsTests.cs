using System;
using System.Linq;
using FizzWare.NBuilder;
using FluentAssertions;
using NUnit.Framework;
using VideoWeb.Common.Models;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.Models.Conference;

public class GetNonScreenedEndpointsTests
{
    [Test]
    public void should_return_non_screened_endpoints()
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
        
        var endpointToScreenFrom1 = Builder<Endpoint>.CreateNew()
            .With(x => x.Id = Guid.NewGuid())
            .With(x => x.DisplayName = "EP2")
            .With(x => x.ExternalReferenceId = Guid.NewGuid().ToString())
            .Build();
        
        var endpointToScreen1 = Builder<Endpoint>.CreateNew()
            .With(x => x.Id = Guid.NewGuid())
            .With(x => x.DisplayName = "EP3")
            .With(x => x.ExternalReferenceId = Guid.NewGuid().ToString())
            .With(x => x.ProtectFrom = [endpointToScreenFrom1.ExternalReferenceId])
            .Build();
        
        // Screening pair 2
        
        var participantToScreenFrom = Builder<Participant>.CreateNew()
            .With(x => x.Role = Role.Individual)
            .With(x => x.Id = Guid.NewGuid())
            .With(x => x.Username = Faker.Internet.Email())
            .With(x => x.ExternalReferenceId = Guid.NewGuid().ToString())
            .Build();
        
        var endpointToScreen2 = Builder<Endpoint>.CreateNew()
            .With(x => x.Id = Guid.NewGuid())
            .With(x => x.DisplayName = "EP4")
            .With(x => x.ExternalReferenceId = Guid.NewGuid().ToString())
            .With(x => x.ProtectFrom = [participantToScreenFrom.ExternalReferenceId])
            .Build();
  
        conference.Participants.AddRange([
            judge, 
            individual,
            participantToScreenFrom]);
        
        conference.Endpoints.AddRange([
            endpoint,
            endpointToScreenFrom1,
            endpointToScreen1,
            endpointToScreen2]);

        // Act
        var result = conference.GetNonScreenedEndpoints();
        
        // Assert
        result.Should().BeEquivalentTo([endpoint]);
    }
}
