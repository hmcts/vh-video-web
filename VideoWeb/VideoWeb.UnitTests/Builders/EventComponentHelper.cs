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


        public List<IEventHandler> GetHandlers()
        {
            var cache = new MemoryCache(new MemoryCacheOptions());
            var eventHubContextMock = new Mock<IHubContext<EventHub.Hub.EventHub, IEventHubClient>>();
            var logger = new Mock<ILogger<EventHandlerBase>>();

            return GetHandlers(eventHubContextMock, cache, logger);
        }

        public List<IEventHandler> GetHandlers(Mock<IHubContext<EventHub.Hub.EventHub, IEventHubClient>> eventHubContextMock,
            IMemoryCache memoryCache, Mock<ILogger<EventHandlerBase>> logger)
        {
            Cache = memoryCache;
            ConferenceCache = new ConferenceCache(memoryCache);
            EventHubContextMock = eventHubContextMock;
            EventHubClientMock = new Mock<IEventHubClient>();
            EventHandlerBaseMock = new Mock<ILogger<EventHandlerBase>>();
            return new List<IEventHandler>
            {
                new CloseEventHandler(eventHubContextMock.Object, ConferenceCache, logger.Object),
                new DisconnectedEventHandler(eventHubContextMock.Object, ConferenceCache, logger.Object),
                new HelpEventHandler(eventHubContextMock.Object, ConferenceCache, logger.Object),
                new JoinedEventHandler(eventHubContextMock.Object, ConferenceCache, logger.Object),
                new JudgeAvailableEventHandler(eventHubContextMock.Object, ConferenceCache, logger.Object),
                new JudgeUnavailableEventHandler(eventHubContextMock.Object, ConferenceCache, logger.Object),
                new LeaveEventHandler(eventHubContextMock.Object, ConferenceCache, logger.Object),
                new PauseEventHandler(eventHubContextMock.Object, ConferenceCache, logger.Object),
                new SuspendEventHandler(eventHubContextMock.Object, ConferenceCache, logger.Object),
                new TransferEventHandler(eventHubContextMock.Object, ConferenceCache, logger.Object),
                new ParticipantJoiningEventHandler(eventHubContextMock.Object, ConferenceCache, logger.Object),
                new VhOfficerCallEventHandler(eventHubContextMock.Object, ConferenceCache, logger.Object)
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
