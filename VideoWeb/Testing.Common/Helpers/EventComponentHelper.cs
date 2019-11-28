using System;
using System.Collections.Generic;
using FizzWare.NBuilder;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Moq;
using VideoWeb.EventHub.Enums;
using VideoWeb.EventHub.Handlers;
using VideoWeb.EventHub.Handlers.Core;
using VideoWeb.EventHub.Hub;
using VideoWeb.EventHub.Models;

namespace Testing.Common.Helpers
{
    public class EventComponentHelper
    {
        public List<IEventHandler> EventHandlersList { get; set; }
        public IMemoryCache Cache { get; set; }
        public Mock<IHubContext<EventHub, IEventHubClient>> EventHubContextMock { get; set; }
        public Mock<IEventHubClient> EventHubClientMock { get; set; }

        public Mock<ILogger<EventHandlerBase>> EventHandlerBaseMock { get; set; }


        public List<IEventHandler> GetHandlers()
        {
            var cache = new MemoryCache(new MemoryCacheOptions());
            var eventHubContextMock = new Mock<IHubContext<EventHub, IEventHubClient>>();
            var logger = new Mock<ILogger<EventHandlerBase>>();

            return GetHandlers(eventHubContextMock, cache, logger);
        }

        public List<IEventHandler> GetHandlers(Mock<IHubContext<EventHub, IEventHubClient>> eventHubContextMock,
            IMemoryCache memoryCache, Mock<ILogger<EventHandlerBase>> logger)
        {
            Cache = memoryCache;
            EventHubContextMock = eventHubContextMock;
            EventHubClientMock = new Mock<IEventHubClient>();
            EventHandlerBaseMock = new Mock<ILogger<EventHandlerBase>>();
            return new List<IEventHandler>
            {
                new CloseEventHandler(eventHubContextMock.Object, memoryCache, logger.Object),
                new DisconnectedEventHandler(eventHubContextMock.Object, memoryCache, logger.Object),
                new HelpEventHandler(eventHubContextMock.Object, memoryCache, logger.Object),
                new JoinedEventHandler(eventHubContextMock.Object, memoryCache, logger.Object),
                new JudgeAvailableEventHandler(eventHubContextMock.Object, memoryCache, logger.Object),
                new LeaveEventHandler(eventHubContextMock.Object, memoryCache, logger.Object),
                new PauseEventHandler(eventHubContextMock.Object, memoryCache, logger.Object),
                new SuspendEventHandler(eventHubContextMock.Object, memoryCache, logger.Object),
                new TransferEventHandler(eventHubContextMock.Object, memoryCache, logger.Object),
                new ParticipantJoiningEventHandler(eventHubContextMock.Object, memoryCache, logger.Object),
                new VhOfficerCallEventHandler(eventHubContextMock.Object, memoryCache, logger.Object)
            };
        }

        public void RegisterUsersForHubContext(IEnumerable<Participant> participants)
        {
            foreach (var participant in participants)
            {
                EventHubContextMock.Setup(x => x.Clients.Group(participant.Username.ToLowerInvariant()))
                    .Returns(EventHubClientMock.Object);
            }

            EventHubContextMock.Setup(x => x.Clients.Group(EventHub.VhOfficersGroupName))
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