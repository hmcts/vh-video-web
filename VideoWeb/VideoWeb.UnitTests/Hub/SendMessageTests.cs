using System;
using System.Linq;
using System.Threading.Tasks;
using FizzWare.NBuilder;
using Moq;
using NUnit.Framework;
using VideoWeb.Common.Models;
using VideoWeb.EventHub.Exceptions;
using VideoWeb.EventHub.Hub;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.Hub
{
    public class SendMessageTests : EventHubBaseTests
    {
        [Test]
        public async Task Should_send_message_to_conference_group_if_user_is_judge()
        {
            var username = "john@doe.com";
            var conferenceId = Guid.NewGuid();
            var participants = Builder<Participant>.CreateListOfSize(2)
                .TheFirst(1).With(x => x.Role = Role.Judge).With(x => x.Username = username)
                .Build().ToList();
            var conference = Builder<Conference>.CreateNew()
                .With(x => x.Id = conferenceId)
                .With(x => x.Participants = participants)
                .Build();
            ConferenceCacheMock.Setup(x => x.GetConferenceAsync(conferenceId)).ReturnsAsync(conference);
            var message = "test message";

            var mockClient = new Mock<IEventHubClient>();
            EventHubClientMock.Setup(x => x.Group(conferenceId.ToString())).Returns(mockClient.Object);

            await Hub.SendMessage(conferenceId, message);

            mockClient.Verify(
                x =>
                    x.ReceiveMessage(conferenceId, username, message, It.IsAny<DateTime>(), It.IsAny<Guid>()),
                Times.Once);
        }

        [Test]
        public void Should_throw_exception_when_conference_is_not_in_cache()
        {
            var conferenceId = Guid.NewGuid();

            var message = "test message";

            var mockClient = new Mock<IEventHubClient>();
            EventHubClientMock.Setup(x => x.Group(conferenceId.ToString())).Returns(mockClient.Object);

            Assert.ThrowsAsync<ConferenceNotFoundException>(() => Hub.SendMessage(conferenceId, message));
        }

        [Test]
        public async Task Should_send_message_to_conference_group_if_user_is_vho()
        {
            var username = "john@doe.com";
            var conferenceId = Guid.NewGuid();
            var participants = Builder<Participant>.CreateListOfSize(2)
                .TheFirst(1).With(x => x.Role = Role.Individual).With(x => x.Username = username)
                .Build().ToList();
            var conference = Builder<Conference>.CreateNew()
                .With(x => x.Id = conferenceId)
                .With(x => x.Participants = participants)
                .Build();
            ConferenceCacheMock.Setup(x => x.GetConferenceAsync(conferenceId)).ReturnsAsync(conference);
            var message = "test message";

            Claims = new ClaimsPrincipalBuilder().WithRole(Role.VideoHearingsOfficer).Build();
            HubCallerContextMock.Setup(x => x.User).Returns(Claims);

            var mockClient = new Mock<IEventHubClient>();
            EventHubClientMock.Setup(x => x.Group(conferenceId.ToString())).Returns(mockClient.Object);

            EventHubClientMock.Setup(x => x.Group(EventHub.Hub.EventHub.VhOfficersGroupName))
                .Returns(mockClient.Object);
            await Hub.SendMessage(conferenceId, message);

            mockClient.Verify(
                x =>
                    x.ReceiveMessage(conferenceId, It.IsAny<string>(), message, It.IsAny<DateTime>(), It.IsAny<Guid>()),
                Times.Once);
        }

        [Test]
        public async Task Should_not_send_message_if_not_judge_or_vho()
        {
            var judgeUsername = "judge@hmcts.net";
            var username = "john@doe.com";
            var conferenceId = Guid.NewGuid();
            var participants = Builder<Participant>.CreateListOfSize(2)
                .TheFirst(1).With(x => x.Role = Role.Judge).With(x => x.Username = judgeUsername)
                .TheNext(1).With(x => x.Role = Role.Individual).With(x => x.Username = username)
                .Build().ToList();
            var conference = Builder<Conference>.CreateNew()
                .With(x => x.Id = conferenceId)
                .With(x => x.Participants = participants)
                .Build();
            ConferenceCacheMock.Setup(x => x.GetConferenceAsync(conferenceId)).ReturnsAsync(conference);
            var message = "test message";

            var mockClient = new Mock<IEventHubClient>();
            EventHubClientMock.Setup(x => x.Group(conferenceId.ToString())).Returns(mockClient.Object);

            await Hub.SendMessage(conferenceId, message);

            mockClient.Verify(
                x =>
                    x.ReceiveMessage(conferenceId, It.IsAny<string>(), message, It.IsAny<DateTime>(), It.IsAny<Guid>()),
                Times.Never);
        }
    }
}
