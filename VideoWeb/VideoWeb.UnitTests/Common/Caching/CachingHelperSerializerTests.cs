using System;
using System.Collections.Generic;
using System.Text.Json;
using FluentAssertions;
using NUnit.Framework;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;

namespace VideoWeb.UnitTests.Common.Caching;

[TestFixture]
public class CachingHelperSerializerTests
{
    private JsonSerializerOptions _options;
    
    [SetUp]
    public void SetUp()
    {
        _options = CachingHelper.JsonSerializerOptions;
    }
    
    [Test]
    public void Read_ShouldDeserializeToConferenceDTO()
    {
        // Arrange
        var conference = new Conference
        {
            Id = Guid.NewGuid(),
            CreatedDateTime = DateTime.UtcNow,
            CaseType = "CaseType",
            CaseNumber = "CaseNumber",
            ScheduledDateTime = DateTime.UtcNow,
            HearingId = Guid.NewGuid(),
            Participants =
            [
                new Participant
                {
                    ContactEmail = "email@email.com",
                }
            ]
        };
        // Act
        //Serialize and Deserialize
        var jsonString =  JsonSerializer.Serialize(conference, _options);
        var result = JsonSerializer.Deserialize<Conference>(jsonString, _options);
        // Assert
        result.Should().Be(conference);
    }
}
