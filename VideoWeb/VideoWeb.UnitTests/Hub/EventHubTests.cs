using System;
using System.Security.Claims;
using System.Security.Principal;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using VideoWeb.Common.SignalR;
using VideoWeb.EventHub.Hub;

namespace VideoWeb.UnitTests.Hub
{
    public class EventHubTests
    {
        private Mock<ILogger<EventHub.Hub.EventHub>> _loggerMock;
        private Mock<IUserProfileService> _userProfileServiceMock;

        [SetUp]
        public void Setup()
        {
            _userProfileServiceMock = new Mock<IUserProfileService>();
            _loggerMock = new Mock<ILogger<EventHub.Hub.EventHub>>();
        }

        [Test]
        public async Task Should_log_a_message_on_connected()
        {
            var clients = new Mock<IHubCallerClients<IEventHubClient>>();
            var principal = new Mock<ClaimsPrincipal>();
            var context = new Mock<HubCallerContext>();
            context.Setup(x => x.User).Returns(principal.Object);
            context.Setup(x => x.ConnectionId).Returns(Guid.NewGuid().ToString());
            context.Setup(x => x.UserIdentifier).Returns("test.name@email.com");
            var identity = new Mock<IIdentity>();
            identity.Setup(x => x.Name).Returns("FirstName LastName");
            principal.Setup(x => x.Identity).Returns(identity.Object);
            var group = new Mock<IGroupManager>();
            var eventHubClient = new EventHub.Hub.EventHub(_userProfileServiceMock.Object, _loggerMock.Object)
            {
                Context = context.Object, Groups = group.Object, Clients = clients.Object
            };
            await eventHubClient.OnConnectedAsync();
            group.Verify(
                x => x.AddToGroupAsync(context.Object.ConnectionId, context.Object.UserIdentifier,
                    CancellationToken.None), Times.Once());
        }

        [Test]
        public async Task Should_log_a_message_on_disconnected()
        {
            var clients = new Mock<IHubCallerClients<IEventHubClient>>();
            var principal = new Mock<ClaimsPrincipal>();
            var context = new Mock<HubCallerContext>();
            context.Setup(x => x.User).Returns(principal.Object);
            context.Setup(x => x.ConnectionId).Returns(Guid.NewGuid().ToString());
            context.Setup(x => x.UserIdentifier).Returns("test.name@email.com");
            var identity = new Mock<IIdentity>();
            identity.Setup(x => x.Name).Returns("FirstName LastName");
            principal.Setup(x => x.Identity).Returns(identity.Object);
            var group = new Mock<IGroupManager>();
            var eventHubClient = new EventHub.Hub.EventHub(_userProfileServiceMock.Object, _loggerMock.Object)
            {
                Context = context.Object, Groups = group.Object, Clients = clients.Object
            };
            var exception = new Exception();
            await eventHubClient.OnDisconnectedAsync(exception);
            group.Verify(
                x => x.RemoveFromGroupAsync(context.Object.ConnectionId, context.Object.UserIdentifier,
                    CancellationToken.None), Times.Once());
        }
    }
}
