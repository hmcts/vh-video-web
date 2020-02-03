using System;
using System.Collections.Generic;
using FizzWare.NBuilder;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using VideoWeb.EventHub.Enums;
using VideoWeb.EventHub.Handlers.Core;
using VideoWeb.EventHub.Hub;
using VideoWeb.EventHub.Models;
using EventComponentHelper = VideoWeb.UnitTests.Builders.EventComponentHelper;

namespace VideoWeb.UnitTests.EventHandlers
{
    public abstract class EventHandlerTestBase
    {
        protected List<IEventHandler> EventHandlersList { get; private set; }
        protected Mock<IEventHubClient> EventHubClientMock { get; private set; }
        protected Mock<IHubContext<EventHub.Hub.EventHub, IEventHubClient>> EventHubContextMock { get; private set; }
        protected IMemoryCache MemoryCache { get; private set; }
        protected Mock<ILogger<EventHandlerBase>> LoggerMock { get; private set; }

        protected Conference TestConference;
        
        [SetUp]
        public void Setup()
        {
            var helper = new EventComponentHelper();
            EventHandlersList = helper.GetHandlers();
            EventHubContextMock = helper.EventHubContextMock;
            EventHubClientMock = helper.EventHubClientMock;
            MemoryCache = helper.Cache;
            LoggerMock = helper.EventHandlerBaseMock;

            TestConference = BuildConferenceForTest();
            MemoryCache.Set(TestConference.Id, TestConference);
            
            helper.RegisterUsersForHubContext(TestConference.Participants);
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