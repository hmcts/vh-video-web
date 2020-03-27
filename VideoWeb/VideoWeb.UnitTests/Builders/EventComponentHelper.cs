using System;
using System.Collections.Generic;
using FizzWare.NBuilder;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Moq;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoWeb.EventHub.Handlers;
using VideoWeb.EventHub.Handlers.Core;
using VideoWeb.EventHub.Hub;
using VideoWeb.Services.Video;

namespace VideoWeb.UnitTests.Builders
{
    public class EventComponentHelper
    {
        public List<IEventHandler> EventHandlersList { get; set; }
        public IMemoryCache Cache { get; set; }
        public IConferenceCache ConferenceCache { get; set; }
        public Mock<IHubContext<EventHub.Hub.EventHub, IEventHubClient>> EventHubContextMock { get; set; }
        public Mock<IEventHubClient> EventHubClientMock { get; set; }

        public Mock<ILogger<EventHandlerBase>> EventHandlerBaseMock { get; set; }
        public Mock<IVideoApiClient> VideoApiClientMock { get; set; }


        public List<IEventHandler> GetHandlers()
        {
            var cache = new MemoryCache(new MemoryCacheOptions());
            var eventHubContextMock = new Mock<IHubContext<EventHub.Hub.EventHub, IEventHubClient>>();
            var logger = new Mock<ILogger<EventHandlerBase>>();
            var apiClient = new Mock<IVideoApiClient>();

            return GetHandlers(eventHubContextMock, cache, logger, apiClient);
        }

        private List<IEventHandler> GetHandlers(
            Mock<IHubContext<EventHub.Hub.EventHub, IEventHubClient>> eventHubContextMock,
            IMemoryCache memoryCache, Mock<ILogger<EventHandlerBase>> logger, Mock<IVideoApiClient> apiClientMock)
        {
            Cache = memoryCache;
            ConferenceCache = new ConferenceCache(memoryCache);
            EventHubContextMock = eventHubContextMock;
            EventHubClientMock = new Mock<IEventHubClient>();
            EventHandlerBaseMock = new Mock<ILogger<EventHandlerBase>>();
            VideoApiClientMock = apiClientMock;
            return new List<IEventHandler>
            {
                new CloseEventHandler(eventHubContextMock.Object, ConferenceCache, logger.Object, apiClientMock.Object),
                new DisconnectedEventHandler(eventHubContextMock.Object, ConferenceCache, logger.Object,
                    apiClientMock.Object),
                new HelpEventHandler(eventHubContextMock.Object, ConferenceCache, logger.Object, apiClientMock.Object),
                new JoinedEventHandler(eventHubContextMock.Object, ConferenceCache, logger.Object,
                    apiClientMock.Object),
                new JudgeAvailableEventHandler(eventHubContextMock.Object, ConferenceCache, logger.Object,
                    apiClientMock.Object),
                new JudgeUnavailableEventHandler(eventHubContextMock.Object, ConferenceCache, logger.Object,
                    apiClientMock.Object),
                new LeaveEventHandler(eventHubContextMock.Object, ConferenceCache, logger.Object, apiClientMock.Object),
                new PauseEventHandler(eventHubContextMock.Object, ConferenceCache, logger.Object, apiClientMock.Object),
                new SuspendEventHandler(eventHubContextMock.Object, ConferenceCache, logger.Object,
                    apiClientMock.Object),
                new TransferEventHandler(eventHubContextMock.Object, ConferenceCache, logger.Object,
                    apiClientMock.Object),
                new ParticipantJoiningEventHandler(eventHubContextMock.Object, ConferenceCache, logger.Object,
                    apiClientMock.Object),
                new VhOfficerCallEventHandler(eventHubContextMock.Object, ConferenceCache, logger.Object,
                    apiClientMock.Object)
            };
        }

        public void RegisterUsersForHubContext(IEnumerable<Participant> participants)
        {
            foreach (var participant in participants)
            {
                EventHubContextMock.Setup(x => x.Clients.Group(participant.Username.ToLowerInvariant()))
                    .Returns(EventHubClientMock.Object);
            }

            EventHubContextMock.Setup(x => x.Clients.Group(EventHub.Hub.EventHub.VhOfficersGroupName))
                .Returns(EventHubClientMock.Object);
        }

        public Conference BuildConferenceForTest()
        {
            return new Conference
            {
                Id = Guid.NewGuid(),
                HearingId = Guid.NewGuid(),
                Participants = new List<Participant>()
                {
                    Builder<Participant>.CreateNew()
                        .With(x => x.Role = Role.Judge).With(x => x.Id = Guid.NewGuid())
                        .Build(),
                    Builder<Participant>.CreateNew().With(x => x.Role = Role.Individual)
                        .With(x => x.Id = Guid.NewGuid()).Build(),
                    Builder<Participant>.CreateNew().With(x => x.Role = Role.Representative)
                        .With(x => x.Id = Guid.NewGuid()).Build(),
                    Builder<Participant>.CreateNew().With(x => x.Role = Role.Individual)
                        .With(x => x.Id = Guid.NewGuid()).Build(),
                    Builder<Participant>.CreateNew().With(x => x.Role = Role.Representative)
                        .With(x => x.Id = Guid.NewGuid()).Build()
                }
            };
        }
    }
}
