using System;
using System.Security.Claims;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using VideoWeb.ChatHub.Hub;
using VideoWeb.Common.SignalR;
using VideoWeb.Services.Video;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.Hub
{
    public abstract class ChatHubBaseTests
    {
        protected Mock<IUserProfileService> UserProfileServiceMock;
        protected Mock<IVideoApiClient> VideoApiClientMock;
        protected Mock<ILogger<ChatHub.Hub.ChatHub>> LoggerMock;
        protected Mock<HubCallerContext> HubCallerContextMock;
        protected Mock<IGroupManager> GroupManagerMock;
        protected Mock<IHubCallerClients<IChatHubClient>> ChatHubClientMock;
        protected ChatHub.Hub.ChatHub Hub;
        protected ClaimsPrincipal Claims;

        [SetUp]
        public void Setup()
        {
            ChatHubClientMock = new Mock<IHubCallerClients<IChatHubClient>>();
            UserProfileServiceMock = new Mock<IUserProfileService>();
            VideoApiClientMock = new Mock<IVideoApiClient>();
            LoggerMock = new Mock<ILogger<ChatHub.Hub.ChatHub>>();
            HubCallerContextMock = new Mock<HubCallerContext>();
            GroupManagerMock = new Mock<IGroupManager>();
            
            Claims = new ClaimsPrincipalBuilder().Build();
            HubCallerContextMock.Setup(x => x.User).Returns(Claims);
            HubCallerContextMock.Setup(x => x.ConnectionId).Returns(Guid.NewGuid().ToString());
            HubCallerContextMock.Setup(x => x.UserIdentifier).Returns(Claims.Identity.Name);
            
            UserProfileServiceMock.Setup(x => x.GetObfuscatedUsernameAsync(It.IsAny<string>()))
                .ReturnsAsync("o**** f*****");


            Hub = new ChatHub.Hub.ChatHub(UserProfileServiceMock.Object, VideoApiClientMock.Object,
                LoggerMock.Object)
            {
                Context = HubCallerContextMock.Object,
                Groups = GroupManagerMock.Object,
                Clients = ChatHubClientMock.Object
            };
        }
        
    }
}
