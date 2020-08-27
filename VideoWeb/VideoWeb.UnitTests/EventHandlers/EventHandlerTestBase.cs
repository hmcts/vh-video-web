using System;
using System.Collections.Generic;
using FizzWare.NBuilder;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoWeb.EventHub.Handlers.Core;
using VideoWeb.EventHub.Hub;
using VideoWeb.Services.Video;
using EventComponentHelper = VideoWeb.UnitTests.Builders.EventComponentHelper;

namespace VideoWeb.UnitTests.EventHandlers
{
    public abstract class EventHandlerTestBase
    {
        protected List<IEventHandler> EventHandlersList { get; private set; }
        protected Mock<IEventHubClient> EventHubClientMock { get; private set; }
        protected Mock<IHubContext<EventHub.Hub.EventHub, IEventHubClient>> EventHubContextMock { get; private set; }
        protected IMemoryCache MemoryCache { get; set; }
        protected IConferenceCache ConferenceCache { get; private set; }
        protected Mock<ILogger<EventHandlerBase>> LoggerMock { get; private set; }
        
        protected Mock<IVideoApiClient> VideoApiClientMock { get; private set; }

        protected Conference TestConference { get; private set; }
        
        [SetUp]
        public void Setup()
        {
            var helper = new EventComponentHelper();
            EventHandlersList = helper.GetHandlers();
            EventHubContextMock = helper.EventHubContextMock;
            EventHubClientMock = helper.EventHubClientMock;
            MemoryCache = helper.Cache;
            ConferenceCache = helper.ConferenceCache;
            LoggerMock = helper.EventHandlerBaseMock;
            VideoApiClientMock = helper.VideoApiClientMock;

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
                Participants = new List<Participant>
                {
                    Builder<Participant>.CreateNew()
                        .With(x => x.Role = Role.Judge).With(x => x.Id = Guid.NewGuid()).With(x => x.Username = "one")
                        .Build(),
                    Builder<Participant>.CreateNew()
                        .With(x => x.Role = Role.Individual).With(x => x.Id = Guid.NewGuid()).With(x => x.Username = "two")
                        .Build(),
                    Builder<Participant>.CreateNew()
                        .With(x => x.Role = Role.Representative).With(x => x.Id = Guid.NewGuid()).With(x => x.Username = "three")
                        .Build(),
                    Builder<Participant>.CreateNew()
                        .With(x => x.Role = Role.Individual).With(x => x.Id = Guid.NewGuid()).With(x => x.Username = "four")
                        .Build(),
                    Builder<Participant>.CreateNew()
                        .With(x => x.Role = Role.Representative).With(x => x.Id = Guid.NewGuid()).With(x => x.Username = "five")
                        .Build()
                },
                Endpoints = new List<Endpoint>
                {
                    Builder<Endpoint>.CreateNew().With(x => x.Id = Guid.NewGuid()).With(x => x.DisplayName = "EP1").Build(),
                    Builder<Endpoint>.CreateNew().With(x => x.Id = Guid.NewGuid()).With(x => x.DisplayName = "EP2").Build()
                },
                HearingVenueName = "Automated unit test venue"
            };
        }
    }
}
