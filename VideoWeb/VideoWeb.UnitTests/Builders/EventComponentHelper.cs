using System;
using System.Collections.Generic;
using BookingsApi.Client;
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
using VideoApi.Client;
using VideoWeb.Common;
using VideoWeb.EventHub.Services;

namespace VideoWeb.UnitTests.Builders;

public class EventComponentHelper
{
    public IMemoryCache Cache { get; set; }
    public Mock<IConferenceService> ConferenceServiceMock { get; set; }
    public Mock<IHubContext<EventHub.Hub.EventHub, IEventHubClient>> EventHubContextMock { get; set; }
    public Mock<IEventHubClient> EventHubClientMock { get; set; }
    public Mock<ILogger<EventHandlerBase>> EventHandlerBaseMock { get; set; }
    public Mock<IVideoApiClient> VideoApiClientMock { get; set; }
    
    
    public List<IEventHandler> GetHandlers()
    {
        var cache = new MemoryCache(new MemoryCacheOptions());
        var eventHubContextMock = new Mock<IHubContext<EventHub.Hub.EventHub, IEventHubClient>>();
        var logger = new Mock<ILogger<EventHandlerBase>>();
        var videoApiClient = new Mock<IVideoApiClient>();
        var consultationNotifier = new Mock<IConsultationNotifier>();
        var conferenceService = new Mock<IConferenceService>();
        
        return GetHandlers(eventHubContextMock, cache, logger, videoApiClient, consultationNotifier, conferenceService);
    }
    
    private List<IEventHandler> GetHandlers(
        Mock<IHubContext<EventHub.Hub.EventHub, IEventHubClient>> eventHubContextMock,
        IMemoryCache memoryCache,
        Mock<ILogger<EventHandlerBase>> logger,
        Mock<IVideoApiClient> videoApiClientMock,
        Mock<IConsultationNotifier> consultationNotifier,
        Mock<IConferenceService> conferenceService)
    {
        Cache = memoryCache;
        ConferenceServiceMock = conferenceService;
        VideoApiClientMock = videoApiClientMock;
        EventHubContextMock = eventHubContextMock;
        EventHubClientMock = new Mock<IEventHubClient>();
        EventHandlerBaseMock = new Mock<ILogger<EventHandlerBase>>();
        return new List<IEventHandler>
        {
            new CloseEventHandler(eventHubContextMock.Object, ConferenceServiceMock.Object, logger.Object),
            new DisconnectedEventHandler(eventHubContextMock.Object, ConferenceServiceMock.Object, logger.Object),
            new HelpEventHandler(eventHubContextMock.Object, ConferenceServiceMock.Object, logger.Object),
            new JoinedEventHandler(eventHubContextMock.Object, ConferenceServiceMock.Object, logger.Object),
            new LeaveEventHandler(eventHubContextMock.Object, ConferenceServiceMock.Object, logger.Object),
            new StartEventHandler(eventHubContextMock.Object, ConferenceServiceMock.Object, logger.Object),
            new CountdownFinishedEventHandler(eventHubContextMock.Object, ConferenceServiceMock.Object, logger.Object),
            new PauseEventHandler(eventHubContextMock.Object, ConferenceServiceMock.Object, logger.Object),
            new SuspendEventHandler(eventHubContextMock.Object, ConferenceServiceMock.Object, logger.Object),
            new TransferEventHandler(eventHubContextMock.Object, ConferenceServiceMock.Object, logger.Object),
            new ParticipantJoiningEventHandler(eventHubContextMock.Object, ConferenceServiceMock.Object, logger.Object),
            new VhOfficerCallEventHandler(eventHubContextMock.Object, logger.Object, videoApiClientMock.Object, consultationNotifier.Object, ConferenceServiceMock.Object),
            new EndpointJoinedEventHandler(eventHubContextMock.Object, ConferenceServiceMock.Object, logger.Object),
            new EndpointDisconnectedEventHandler(eventHubContextMock.Object, ConferenceServiceMock.Object, logger.Object),
            new EndpointTransferEventHandler(eventHubContextMock.Object, ConferenceServiceMock.Object, logger.Object),
            new AllocationHearingsEventHandler(eventHubContextMock.Object, ConferenceServiceMock.Object, logger.Object)
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
            },
            CivilianRooms = new List<CivilianRoom>
            {
                new () {Id = 1, RoomLabel = "Interpreter1", Participants = {Guid.NewGuid(), Guid.NewGuid()}}
            }
        };
    }
}
