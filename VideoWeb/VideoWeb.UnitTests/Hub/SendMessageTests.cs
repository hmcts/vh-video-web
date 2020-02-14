using System;
using System.Threading.Tasks;
using Moq;
using NUnit.Framework;
using VideoWeb.EventHub.Hub;

namespace VideoWeb.UnitTests.Hub
{
    public class SendMessageTests : EventHubBaseTests
    {
        [Test]
        public async Task should_send_message_to_conference_group()
        {
            var conferenceId = Guid.NewGuid();
            var message = "test message";

            var mockClient = new Mock<IEventHubClient>();
            EventHubClientMock.Setup(x => x.Group(conferenceId.ToString())).Returns(mockClient.Object);

            await Hub.SendMessage(conferenceId, message);

            mockClient.Verify(
                x => 
                    x.ReceiveMessage(conferenceId, It.IsAny<string>(), message, It.IsAny<DateTime>()), 
                Times.Once);
        }
    }
}
