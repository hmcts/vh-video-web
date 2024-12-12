using System;
using System.Text.Encodings.Web;
using System.Text.Json;
using FluentAssertions;
using NUnit.Framework;
using VideoWeb.Extensions.SerialisationConfig;

namespace VideoWeb.UnitTests.Common.SerializerConfigTests;

[TestFixture]
public class DateTimeConverterTests
{
    private JsonSerializerOptions _options;
    
    [SetUp]
    public void SetUp()
    {
        _options = new JsonSerializerOptions{
            Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping 
        };
        _options.Converters.Add(new DateTimeUTCConverter());
    }
    
    [Test]
    public void Read_ShouldDeserializeIso8601DateTimeToUtc()
    {
        // Arrange
        var json = "\"2024-12-12T12:34:56Z\""; // ISO 8601 format with UTC (Z)
        
        // Act
        var result = JsonSerializer.Deserialize<DateTime>(json, _options);
        
        // Assert
        result.Should().Be(new DateTime(2024, 12, 12, 12, 34, 56, DateTimeKind.Utc));
    }
    
    [Test]
    public void Write_ShouldSerializeDateTimeToIso8601String()
    {
        // Arrange
        var dateTime = new DateTime(2024, 12, 12, 12, 34, 56, DateTimeKind.Utc);
        
        // Act
        var json = JsonSerializer.Serialize(dateTime, _options);
        
        // Assert
        json.Should().Be("\"2024-12-12T12:34:56.0000000Z\"");
    }
    
    [Test]
    public void Read_ShouldConvertDateTimeToUtc()
    {
        // Arrange
        var json = "\"2024-12-12T12:34:56\""; // No "Z", considered as local time
        
        // Act
        var result = JsonSerializer.Deserialize<DateTime>(json, _options);
        
        // Assert
        // Ensure that the result is converted to UTC time
        result.Should().Be(new DateTime(2024, 12, 12, 12, 34, 56, DateTimeKind.Utc));
    }
    
    [Test]
    public void Write_ShouldHandleDifferentDateTimeFormats()
    {
        // Arrange
        var dateTime = new DateTime(2024, 12, 12, 12, 34, 56, DateTimeKind.Local);
        
        // Act
        var json = JsonSerializer.Serialize(dateTime, _options);
        
        // Assert
        json.Should().Be("\"2024-12-12T12:34:56.0000000+00:00\""); // Should still output in UTC format
    }
}
