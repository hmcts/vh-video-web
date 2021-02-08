using System;
using System.Collections.Generic;
using FluentAssertions;
using FluentAssertions.Extensions;
using NUnit.Framework;
using VideoWeb.Common.Models;
using VideoWeb.Mappings;
using VideoWeb.Services.Video;

namespace VideoWeb.UnitTests.Mappings
{
    public class ChatResponseMapperTests : BaseMockerSutTestSetup<ChatResponseMapper>
    {
        [Test]
        public void Should_map_all_properties()
        {
            
            const string senderUsername = "john@doe.com";
            const string recipientUsername = "other@doe.com";
            const string fromDisplayName = "Johnny";
            var conference = new Conference
            {
                Id = Guid.NewGuid(),
                Participants = new List<Participant>
                {
                    new Participant { Id = Guid.NewGuid(), Username = senderUsername },
                    new Participant { Id = Guid.NewGuid(), Username = recipientUsername }
                }
            };

            var message = new InstantMessageResponse
            {
                From = senderUsername,
                To = recipientUsername,
                Message_text = "test message from john",
                Time_stamp = DateTime.Now.AsUtc()
            };

            var response = _sut.Map(message, fromDisplayName, true, conference);

            response.From.Should().Be(conference.Participants[0].Id.ToString());
            response.FromDisplayName.Should().Be(fromDisplayName);
            response.To.Should().Be(conference.Participants[1].Id.ToString());
            response.Message.Should().Be(message.Message_text);
            response.Timestamp.Should().Be(message.Time_stamp);
            response.IsUser.Should().BeTrue();
            response.Id.Should().NotBeEmpty();
        }
    }
}
