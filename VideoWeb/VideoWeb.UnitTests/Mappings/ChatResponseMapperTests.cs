using System;
using System.Collections.Generic;
using FluentAssertions;
using FluentAssertions.Extensions;
using NUnit.Framework;
using VideoWeb.Common.Models;
using VideoWeb.Mappings;
using VideoApi.Contract.Responses;

namespace VideoWeb.UnitTests.Mappings
{
    public class ChatResponseMapperTests : BaseMockerSutTestSetup<ChatResponseMapper>
    {
        [Test]
        public void Should_map_all_properties()
        {
            
            const string senderUsername = "john@hmcts.net";
            const string recipientUsername = "other@hmcts.net";
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
                MessageText = "test message from john",
                TimeStamp = DateTime.Now.AsUtc()
            };

            var response = _sut.Map(message, fromDisplayName, true, conference);

            response.From.Should().Be(conference.Participants[0].Id.ToString());
            response.FromDisplayName.Should().Be(fromDisplayName);
            response.To.Should().Be(conference.Participants[1].Id.ToString());
            response.Message.Should().Be(message.MessageText);
            response.Timestamp.Should().Be(message.TimeStamp);
            response.IsUser.Should().BeTrue();
            response.Id.Should().NotBeEmpty();
        }
    }
}
