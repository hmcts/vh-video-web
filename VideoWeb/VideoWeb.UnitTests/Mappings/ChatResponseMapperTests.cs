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
        
        private ChatResponseMapper _mapper;

        [SetUp]
        public void Setup()
        {
            _mapper = new ChatResponseMapper();
        }
        
        [Test]
        public void should_map_all_properties()
        {
            var username = "john@doe.com";
            var fromDisplayName = "Johnny";
            var message = new InstantMessageResponse
            {
                From = username,
                Message_text = "test message from john",
                Time_stamp = DateTime.Now.AsUtc()
            };

            var response = _mapper.MapToResponseModel(message, fromDisplayName, true);
            response.From.Should().Be(fromDisplayName);
            response.Message.Should().Be(message.Message_text);
            response.Timestamp.Should().Be(message.Time_stamp);
            response.IsUser.Should().BeTrue();
        }
    }
}
