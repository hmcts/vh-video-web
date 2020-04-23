using System;
using FluentAssertions;
using FluentAssertions.Extensions;
using NUnit.Framework;
using VideoWeb.Mappings;
using VideoWeb.Services.Video;

namespace VideoWeb.UnitTests.Mappings
{
    public class ChatResponseMapperTests
    {
        [Test]
        public void Should_map_all_properties()
        {
            const string username = "john@doe.com";
            const string fromDisplayName = "Johnny";
            
            var message = new InstantMessageResponse
            {
                From = username,
                Message_text = "test message from john",
                Time_stamp = DateTime.Now.AsUtc()
            };

            var response = ChatResponseMapper.MapToResponseModel(message, fromDisplayName, true);
            
            response.From.Should().Be(fromDisplayName);
            response.Message.Should().Be(message.Message_text);
            response.Timestamp.Should().Be(message.Time_stamp);
            response.IsUser.Should().BeTrue();
            response.Id.Should().NotBeEmpty();
        }
    }
}
