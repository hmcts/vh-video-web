using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using FizzWare.NBuilder;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoWeb.Common.SignalR;
using VideoWeb.EventHub.Hub;
using VideoWeb.EventHub.Mappers;
using VideoWeb.Services.Video;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.Hub
{
    public abstract class EventHubBaseTests
    {
        protected Mock<IUserProfileService> UserProfileServiceMock;
        protected Mock<IVideoApiClient> VideoApiClientMock;
        protected Mock<ILogger<EventHub.Hub.EventHub>> LoggerMock;
        protected Mock<HubCallerContext> HubCallerContextMock;
        protected Mock<IGroupManager> GroupManagerMock;
        protected Mock<IHubCallerClients<IEventHubClient>> EventHubClientMock;
        protected EventHub.Hub.EventHub Hub;
        protected ClaimsPrincipal Claims;
        protected Mock<IConferenceCache> ConferenceCacheMock;
        protected Mock<IHeartbeatRequestMapper> HeartbeatMapper;

        [SetUp]
        public void Setup()
        {
            EventHubClientMock = new Mock<IHubCallerClients<IEventHubClient>>();
            UserProfileServiceMock = new Mock<IUserProfileService>();
            VideoApiClientMock = new Mock<IVideoApiClient>();
            LoggerMock = new Mock<ILogger<EventHub.Hub.EventHub>>();
            HubCallerContextMock = new Mock<HubCallerContext>();
            GroupManagerMock = new Mock<IGroupManager>();
            HeartbeatMapper = new Mock<IHeartbeatRequestMapper>();

            Claims = new ClaimsPrincipalBuilder().Build();
            HubCallerContextMock.Setup(x => x.User).Returns(Claims);
            HubCallerContextMock.Setup(x => x.ConnectionId).Returns(Guid.NewGuid().ToString());
            HubCallerContextMock.Setup(x => x.UserIdentifier).Returns(Claims.Identity.Name);

            UserProfileServiceMock.Setup(x => x.GetObfuscatedUsernameAsync(It.IsAny<string>()))
                .ReturnsAsync("o**** f*****");

            ConferenceCacheMock = new Mock<IConferenceCache>();
            Hub = new EventHub.Hub.EventHub(UserProfileServiceMock.Object, VideoApiClientMock.Object,
                LoggerMock.Object, ConferenceCacheMock.Object, HeartbeatMapper.Object)
            {
                Context = HubCallerContextMock.Object,
                Groups = GroupManagerMock.Object,
                Clients = EventHubClientMock.Object
            };
        }

        protected List<ConferenceForAdminResponse> SetupAdminConferences(int numOfConferences)
        {
            var conferences = Builder<ConferenceForAdminResponse>.CreateListOfSize(numOfConferences).All()
                .With(x => x.Id = Guid.NewGuid())
                .Build().ToList();

            Claims = new ClaimsPrincipalBuilder().WithRole(Role.VideoHearingsOfficer).Build();
            HubCallerContextMock.Setup(x => x.User).Returns(Claims);
            
            VideoApiClientMock.Setup(x => x.GetConferencesTodayForAdminAsync()).ReturnsAsync(conferences);

            return conferences;
        }

        protected string[] SetupJudgeConferences(int numOfConferences, int numOfConferencesWithUser)
        {
            var participantsWithUser = Builder<ParticipantSummaryResponse>.CreateListOfSize(3)
                .TheFirst(1).With(x => x.Username = Claims.Identity.Name).With(x => x.User_role = UserRole.Judge)
                .Build().ToList();
            var participantsWithoutUser = Builder<ParticipantSummaryResponse>.CreateListOfSize(3)
                .TheFirst(1).With(x => x.User_role = UserRole.Judge)
                .Build().ToList();

            var conferences = Builder<ConferenceForAdminResponse>.CreateListOfSize(numOfConferences).All()
                .With(x => x.Id = Guid.NewGuid())
                .TheFirst(numOfConferencesWithUser).With(x => x.Participants = participantsWithUser)
                .TheRest().With(x => x.Participants = participantsWithoutUser)
                .Build().ToList();

            Claims = new ClaimsPrincipalBuilder().WithRole(Role.Judge).Build();
            HubCallerContextMock.Setup(x => x.User).Returns(Claims);
            
            VideoApiClientMock.Setup(x => x.GetConferencesTodayForAdminAsync()).ReturnsAsync(conferences);

            return conferences
                .Where(x => x.Participants.Any(p => p.Username == Claims.Identity.Name))
                .Select(c => c.Id.ToString()).ToArray();
        }
    }
}
