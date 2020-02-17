using System;
using System.Linq;
using System.Threading.Tasks;
using FizzWare.NBuilder;
using Microsoft.Extensions.Caching.Memory;
using Moq;
using NUnit.Framework;
using VideoWeb.EventHub.Enums;
using VideoWeb.EventHub.Hub;
using VideoWeb.EventHub.Models;

namespace VideoWeb.UnitTests.Hub
{
    public class SendMessageTests : EventHubBaseTests
    {
        [Test]
        public async Task should_send_message_to_conference_group()
        {
            var username = "john@doe.com";
            var conferenceId = Guid.NewGuid();
            var participants = Builder<Participant>.CreateListOfSize(2)
                .TheFirst(1).With(x => x.Role = UserRole.Judge).With(x => x.Username = username)
                .Build().ToList();
            var conference = Builder<Conference>.CreateNew()
                .With(x => x.Id = conferenceId)
                .With(x => x.Participants = participants)
                .Build();
            MemoryCache.Set(conferenceId, conference);
            var message = "test message";

            var mockClient = new Mock<IEventHubClient>();
            EventHubClientMock.Setup(x => x.Group(conferenceId.ToString())).Returns(mockClient.Object);

            await Hub.SendMessage(conferenceId, message);

            mockClient.Verify(
                x => 
                    x.ReceiveMessage(conferenceId, It.IsAny<string>(), message, It.IsAny<DateTime>()), 
                Times.Once);
        }

        [Test]
        public async Task should_not_send_message_if_not_judge_or_vho()
        {
            var judgeUsername = "judge@hmcts.net";
            var username = "john@doe.com";
            var conferenceId = Guid.NewGuid();
            var participants = Builder<Participant>.CreateListOfSize(2)
                .TheFirst(1).With(x => x.Role = UserRole.Judge).With(x => x.Username = judgeUsername)
                .TheNext(1).With(x => x.Role = UserRole.Individual).With(x => x.Username = username)
                .Build().ToList();
            var conference = Builder<Conference>.CreateNew()
                .With(x => x.Id = conferenceId)
                .With(x => x.Participants = participants)
                .Build();
            MemoryCache.Set(conferenceId, conference);
            var message = "test message";

            var mockClient = new Mock<IEventHubClient>();
            EventHubClientMock.Setup(x => x.Group(conferenceId.ToString())).Returns(mockClient.Object);

            await Hub.SendMessage(conferenceId, message);

            mockClient.Verify(
                x => 
                    x.ReceiveMessage(conferenceId, It.IsAny<string>(), message, It.IsAny<DateTime>()), 
                Times.Never);
        }
    }
}
