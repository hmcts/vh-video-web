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
using VideoApi.Client;
using VideoApi.Contract.Responses;
using VideoWeb.UnitTests.Builders;
using VideoApi.Contract.Enums;
using VideoWeb.Common.Configuration;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Configuration;

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
        protected Mock<IOptions<HearingServicesConfiguration>> ServicesConfigurationMock;

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
            ConferenceCacheMock = new Mock<IConferenceCache>();
            ServicesConfigurationMock = new Mock<IOptions<HearingServicesConfiguration>>();


            Claims = new ClaimsPrincipalBuilder().Build();
            HubCallerContextMock.Setup(x => x.User).Returns(Claims);
            HubCallerContextMock.Setup(x => x.ConnectionId).Returns(Guid.NewGuid().ToString());
            HubCallerContextMock.Setup(x => x.UserIdentifier).Returns(Claims.Identity.Name);

            UserProfileServiceMock.Setup(x => x.GetObfuscatedUsernameAsync(It.IsAny<string>()))
                .ReturnsAsync("o**** f*****");

            var configRootBuilder = new ConfigurationBuilder()
                .AddUserSecrets<Startup>();

            var configRoot = configRootBuilder.Build();
            var vhServicesConfigurationOptions = Options.Create(configRoot.GetSection("VhServices").Get<HearingServicesConfiguration>());
            var vhServicesConfiguration = vhServicesConfigurationOptions.Value;

            ServicesConfigurationMock.Setup(x => x.Value).Returns(vhServicesConfiguration);


            Hub = new EventHub.Hub.EventHub(UserProfileServiceMock.Object, VideoApiClientMock.Object,
                LoggerMock.Object, ConferenceCacheMock.Object, HeartbeatMapper.Object, ServicesConfigurationMock.Object)
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

            Claims = new ClaimsPrincipalBuilder().WithRole(AppRoles.VhOfficerRole).Build();
            HubCallerContextMock.Setup(x => x.User).Returns(Claims);

            VideoApiClientMock.Setup(x => x.GetConferencesTodayForAdminAsync(It.IsAny<IEnumerable<string>>())).ReturnsAsync(conferences);

            return conferences;
        }

        protected string[] SetupJudgeConferences(int numOfConferences, int numOfConferencesWithUser)
        {
            var participantsWithUser = Builder<ParticipantSummaryResponse>.CreateListOfSize(3)
                .TheFirst(1).With(x => x.Username = Claims.Identity.Name).With(x => x.UserRole = UserRole.Judge)
                .Build().ToList();
            var participantsWithoutUser = Builder<ParticipantSummaryResponse>.CreateListOfSize(3)
                .TheFirst(1).With(x => x.UserRole = UserRole.Judge)
                .Build().ToList();

            var conferences = Builder<ConferenceForAdminResponse>.CreateListOfSize(numOfConferences).All()
                .With(x => x.Id = Guid.NewGuid())
                .TheFirst(numOfConferencesWithUser).With(x => x.Participants = participantsWithUser)
                .TheRest().With(x => x.Participants = participantsWithoutUser)
                .Build().ToList();

            Claims = new ClaimsPrincipalBuilder().WithRole(AppRoles.JudgeRole).Build();
            HubCallerContextMock.Setup(x => x.User).Returns(Claims);

            VideoApiClientMock.Setup(x => x.GetConferencesTodayForAdminAsync(It.IsAny<IEnumerable<string>>()))
                .ReturnsAsync(conferences);

            return conferences
                .Where(x => x.Participants.Any(p => p.Username == Claims.Identity.Name))
                .Select(c => c.Id.ToString()).ToArray();
        }
        
        protected void UpdateUserIdentity(ClaimsPrincipal claims)
        {
            HubCallerContextMock.Setup(x => x.User).Returns(claims);
            HubCallerContextMock.Setup(x => x.UserIdentifier).Returns(claims.Identity.Name);
        }
        
        protected Conference CreateTestConference(string participantUsername, bool withLinked = false)
        {
            var conferenceId = Guid.NewGuid();
            var participants = Builder<Participant>.CreateListOfSize(5)
                .All().With(x=> x.Id = Guid.NewGuid()).With(x=>x.Username = Faker.Internet.Email())
                .With(x => x.LinkedParticipants = new List<LinkedParticipant>())
                .TheFirst(1).With(x => x.Role = Role.Judge)
                .TheNext(2).With(x=> x.Role = Role.JudicialOfficeHolder)
                .TheNext(1).With(x => x.Role = Role.Individual).With(x => x.Username = participantUsername)
                .TheNext(1).With(x => x.Role = Role.Individual)
                .Build().ToList();

            if (withLinked)
            {
                var individuals = participants.Where(x => x.Role == Role.Individual).ToList();
                var participantA = individuals[0];
                var participantB = individuals[1];
                participantA.LinkedParticipants.Add(new LinkedParticipant{ LinkedId = participantB.Id, LinkType = LinkType.Interpreter});
                participantB.LinkedParticipants.Add(new LinkedParticipant{ LinkedId = participantA.Id, LinkType = LinkType.Interpreter});
            }

            return Builder<Conference>.CreateNew()
                .With(x => x.Id = conferenceId)
                .With(x => x.Participants = participants)
                .Build();
        }

        protected void SetupEventHubClientsForAllParticipantsInConference(Conference conference, bool includeAdmin)
        {
            if (includeAdmin)
            {
                var mockAdminClient = new Mock<IEventHubClient>();
                EventHubClientMock.Setup(x => x.Group(EventHub.Hub.EventHub.VhOfficersGroupName))
                    .Returns(mockAdminClient.Object);
            }

            foreach (var conferenceParticipant in conference.Participants)
            {
                var mockClient = new Mock<IEventHubClient>();
                EventHubClientMock.Setup(x => x.Group(conferenceParticipant.Username.ToLowerInvariant()))
                    .Returns(mockClient.Object);
            }
        }
    }
}
