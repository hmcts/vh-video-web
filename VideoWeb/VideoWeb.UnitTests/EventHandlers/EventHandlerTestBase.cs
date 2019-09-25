using System;
using System.Collections.Generic;
using FizzWare.NBuilder;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Caching.Memory;
using Moq;
using NUnit.Framework;
using Testing.Common.Helpers;
using VideoWeb.EventHub.Enums;
using VideoWeb.EventHub.Handlers.Core;
using VideoWeb.EventHub.Hub;
using VideoWeb.EventHub.Models;

namespace VideoWeb.UnitTests.EventHandlers
{
    public abstract class EventHandlerTestBase
    {
        protected List<IEventHandler> EventHandlersList;
        protected Mock<IEventHubClient> EventHubClientMock;
        protected Mock<IHubContext<EventHub.Hub.EventHub, IEventHubClient>> EventHubContextMock;
        protected IMemoryCache MemoryCache;

        protected Conference TestConference;
        
        [SetUp]
        public void Setup()
        {
            EventHubContextMock = new Mock<IHubContext<EventHub.Hub.EventHub, IEventHubClient>>();
            EventHubClientMock = new Mock<IEventHubClient>();
            MemoryCache = new MemoryCache(new MemoryCacheOptions());

            EventHandlersList = EventHandlerListBuilder.Get(EventHubContextMock, MemoryCache);

            TestConference = BuildConferenceForTest();
            MemoryCache.Set(TestConference.Id, TestConference);
            
            foreach (var participant in TestConference.Participants)
            {
                EventHubContextMock.Setup(x => x.Clients.Group(participant.Username.ToLowerInvariant()))
                    .Returns(EventHubClientMock.Object);
            }
            EventHubContextMock.Setup(x => x.Clients.Group(EventHub.Hub.EventHub.VhOfficersGroupName))
                .Returns(EventHubClientMock.Object);
        }

        private static Conference BuildConferenceForTest()
        {
            return new Conference
            {
                Id = Guid.NewGuid(),
                HearingId = Guid.NewGuid(),
                Participants = new List<Participant>()
                {
                    Builder<Participant>.CreateNew()
                        .With(x => x.Role = UserRole.Judge).With(x => x.Id = Guid.NewGuid())
                        .Build(),
                    Builder<Participant>.CreateNew().With(x => x.Role = UserRole.Individual)
                        .With(x => x.Id = Guid.NewGuid()).Build(),
                    Builder<Participant>.CreateNew().With(x => x.Role = UserRole.Representative)
                        .With(x => x.Id = Guid.NewGuid()).Build(),
                    Builder<Participant>.CreateNew().With(x => x.Role = UserRole.Individual)
                        .With(x => x.Id = Guid.NewGuid()).Build(),
                    Builder<Participant>.CreateNew().With(x => x.Role = UserRole.Representative)
                        .With(x => x.Id = Guid.NewGuid()).Build()
                }
            };
        }
    }
}