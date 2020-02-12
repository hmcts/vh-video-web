using System;
using System.Threading.Tasks;
using Moq;
using NUnit.Framework;
using VideoWeb.ChatHub.Hub;

namespace VideoWeb.UnitTests.Hub
{
    public class SendMessageTests : ChatHubBaseTests
    {
        [Test]
        public async Task should_send_message_to_conference_group()
        {
            var conferenceId = Guid.NewGuid();
            var from = "john@doe.com";
            var message = "test message";

            var mockClient = new Mock<IChatHubClient>();
            ChatHubClientMock.Setup(x => x.Group(conferenceId.ToString())).Returns(mockClient.Object);

            await Hub.SendMessage(conferenceId, from, message);

            mockClient.Verify(
                x => x.ReceiveMessage(conferenceId, from, message, It.IsAny<DateTime>()), Times.Once);
        }
    }
}
