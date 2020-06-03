using System;
using System.Linq;
using System.Threading.Tasks;
using FizzWare.NBuilder;
using Moq;
using NUnit.Framework;
using VideoWeb.Common.Models;
using VideoWeb.EventHub.Hub;
using VideoWeb.Services.Video;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.Hub
{
    public class SendMessageTests : EventHubBaseTests
    {
        [Test]
        public async Task Should_send_message_to_conference_group_if_user_is_judge()
        {
            var username = "john@doe.com";
            var toUsername = "recipient@test.com";
            var conferenceId = Guid.NewGuid();
            var participants = Builder<Participant>.CreateListOfSize(2)
                .TheFirst(1).With(x => x.Role = Role.Judge).With(x => x.Username = username)
                .TheRest().With(x => x.Role = Role.Individual)
                .Build().ToList();
            var conference = Builder<Conference>.CreateNew()
                .With(x => x.Id = conferenceId)
                .With(x => x.Participants = participants)
                .Build();
            
            ConferenceCacheMock.Setup(cache => cache.GetOrAddConferenceAsync(conferenceId, It.IsAny<Func<Task<ConferenceDetailsResponse>>>()))
                .Callback(async (Guid anyGuid, Func<Task<ConferenceDetailsResponse>> factory) => await factory())
                .ReturnsAsync(conference);
            
            var message = "test message";

            var mockClient = new Mock<IEventHubClient>();
            EventHubClientMock.Setup(x => x.Group(conferenceId.ToString())).Returns(mockClient.Object);

            await Hub.SendMessage(conferenceId, message, toUsername);

            mockClient.Verify(
                x =>
                    x.ReceiveMessage(conferenceId, username, toUsername, message, It.IsAny<DateTime>(), It.IsAny<Guid>()),
                Times.Once);
        }

        [Test]
        public async Task Should_send_message_to_conference_group_if_user_is_vho()
        {
            var username = "john@doe.com";
            var toUsername = "recipient@test.com";
            var conferenceId = Guid.NewGuid();
            var participants = Builder<Participant>.CreateListOfSize(2)
                .TheFirst(1).With(x => x.Role = Role.Individual).With(x => x.Username = username)
                .Build().ToList();
            var conference = Builder<Conference>.CreateNew()
                .With(x => x.Id = conferenceId)
                .With(x => x.Participants = participants)
                .Build();
            
            ConferenceCacheMock.Setup(cache => cache.GetOrAddConferenceAsync(conferenceId, It.IsAny<Func<Task<ConferenceDetailsResponse>>>()))
                .Callback(async (Guid anyGuid, Func<Task<ConferenceDetailsResponse>> factory) => await factory())
                .ReturnsAsync(conference);
            
            var message = "test message";

            Claims = new ClaimsPrincipalBuilder().WithRole(Role.VideoHearingsOfficer).Build();
            HubCallerContextMock.Setup(x => x.User).Returns(Claims);

            var mockClient = new Mock<IEventHubClient>();
            EventHubClientMock.Setup(x => x.Group(conferenceId.ToString())).Returns(mockClient.Object);

            EventHubClientMock.Setup(x => x.Group(EventHub.Hub.EventHub.VhOfficersGroupName))
                .Returns(mockClient.Object);
            await Hub.SendMessage(conferenceId, message, toUsername);

            mockClient.Verify(
                x =>
                    x.ReceiveMessage(conferenceId, It.IsAny<string>(), toUsername, message, It.IsAny<DateTime>(), It.IsAny<Guid>()),
                Times.Once);
        }

        [Test]
        public async Task Should_not_send_message_if_not_judge_or_vho()
        {
            var judgeUsername = "judge@hmcts.net";
            var username = "john@doe.com";
            var toUsername = "recipient@test.com";
            var conferenceId = Guid.NewGuid();
            var participants = Builder<Participant>.CreateListOfSize(2)
                .TheFirst(1).With(x => x.Role = Role.Judge).With(x => x.Username = judgeUsername)
                .TheNext(1).With(x => x.Role = Role.Individual).With(x => x.Username = username)
                .Build().ToList();
            var conference = Builder<Conference>.CreateNew()
                .With(x => x.Id = conferenceId)
                .With(x => x.Participants = participants)
                .Build();
            
            ConferenceCacheMock.Setup(cache => cache.GetOrAddConferenceAsync(conferenceId, It.IsAny<Func<Task<ConferenceDetailsResponse>>>()))
                .Callback(async (Guid anyGuid, Func<Task<ConferenceDetailsResponse>> factory) => await factory())
                .ReturnsAsync(conference);
            
            var message = "test message";

            var mockClient = new Mock<IEventHubClient>();
            EventHubClientMock.Setup(x => x.Group(conferenceId.ToString())).Returns(mockClient.Object);

            await Hub.SendMessage(conferenceId, toUsername, message);

            mockClient.Verify(
                x =>
                    x.ReceiveMessage(conferenceId, It.IsAny<string>(), toUsername,message, It.IsAny<DateTime>(), It.IsAny<Guid>()),
                Times.Never);
        }
    }
}
