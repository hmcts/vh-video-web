using System;
using Autofac.Extras.Moq;
using Moq;
using NUnit.Framework;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using VideoApi.Contract.Requests;
using VideoWeb.Common.Models;
using VideoWeb.EventHub.Enums;
using VideoWeb.EventHub.Handlers.Core;
using VideoWeb.EventHub.Hub;
using VideoWeb.EventHub.Models;
using VideoWeb.Helpers;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.Helpers;

internal class AllocationHearingsEventNotifierTests
{
    private AllocationHearingsEventNotifier _notifier;
    private Conference _conference;
    private EventComponentHelper _eventHelper;
    private List<HearingDetailRequest> _hearings;
    private const string CsoUserName = "username@email.com";
    
    [SetUp]
    public void SetUp()
    {
        _hearings = new List<HearingDetailRequest>();
        
        var hearing = new HearingDetailRequest();
        hearing.Judge = "Judge Name 1";
        hearing.Time = new DateTimeOffset(new DateTime(2023,04,01,10,00,00));
        hearing.CaseName = "Case Name";
        
        _hearings.Add(hearing);
        
        _conference = new ConferenceCacheModelBuilder().Build();
        _eventHelper = new EventComponentHelper
        {
            EventHubContextMock = new Mock<IHubContext<EventHub.Hub.EventHub, IEventHubClient>>(),
            EventHubClientMock = new Mock<IEventHubClient>()
        };
        // this will register all participants as connected to the hub
        _eventHelper.RegisterUsersForHubContext(_conference.Participants);
        _eventHelper.RegisterParticipantForHubContext(CsoUserName);
        _notifier = new AllocationHearingsEventNotifier(_eventHelper.EventHubContextMock.Object);
    }
    
    [Test]
    public async Task Should_send_event()
    {
        // Act
        await _notifier.PushAllocationHearingsEvent(CsoUserName, _hearings);
        
        _eventHelper.EventHubClientMock.Verify(x => x.AllocationHearings(CsoUserName, _hearings), Times.Once);
    }
    
    [Test]
    public async Task Should_not_send_event_when_hearings_is_empty()
    {
        // arrange
        _hearings = new List<HearingDetailRequest>();
        
        // act
        await _notifier.PushAllocationHearingsEvent(CsoUserName, _hearings);
        
        // assert
        _eventHelper.EventHubClientMock.Verify(x => x.AllocationHearings(CsoUserName, _hearings), Times.Never);
    }
}
