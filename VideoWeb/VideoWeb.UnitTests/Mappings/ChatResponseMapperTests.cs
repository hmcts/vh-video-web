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
        private readonly ChatResponseMapper _mapper = new ChatResponseMapper();
        
        [Test]
        public void should_map_all_properties_and_is_user_true()
        {
            var username = "john@doe.com";
            var message = new MessageResponse
            {
                From = username,
                Message_text = "test message from john",
                Time_stamp = new DateTime().AsUtc()
            };

            var response = _mapper.MapToResponseModel(message, username);
            response.From.Should().Be(username);
            response.Message.Should().Be(message.Message_text);
            response.Timestamp.Should().Be(message.Time_stamp);
            response.IsUser.Should().BeTrue();
        }

        [Test]
        public void should_map_all_properties_and_is_user_false()
        {
            var username = "john@doe.com";
            var otherUser = "someone@else.com";
            var message = new MessageResponse
            {
                From = username,
                Message_text = "test message from john",
                Time_stamp = new DateTime().AsUtc()
            };
            
            var response = _mapper.MapToResponseModel(message, otherUser);
            response.From.Should().Be(username);
            response.Message.Should().Be(message.Message_text);
            response.Timestamp.Should().Be(message.Time_stamp);
            response.IsUser.Should().BeFalse();
        }
    }
}
