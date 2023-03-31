using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Autofac.Extras.Moq;
using Microsoft.AspNetCore.SignalR;
using Moq;
using NUnit.Framework;
using VideoWeb.Common.Models;
using VideoWeb.EventHub.Hub;
using VideoWeb.EventHub.Models;
using VideoWeb.InternalEvents;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.InternalEvents;

public class AllocationUpdatedEventNotifierTests
{
    private AllocationUpdatedEventNotifier _sut;
    private EventComponentHelper _eventComponentHelper;
    private List<Conference> _conferences;

    [SetUp]
    public void SetUp()
    {
        _eventComponentHelper = new EventComponentHelper
        {
            EventHubContextMock = new Mock<IHubContext<EventHub.Hub.EventHub, IEventHubClient>>(),
            EventHubClientMock = new Mock<IEventHubClient>()
        };
        _sut = new AllocationUpdatedEventNotifier(_eventComponentHelper.EventHubContextMock.Object);
        _conferences = new List<Conference>()
        {
            _eventComponentHelper.BuildConferenceForTest(),
            _eventComponentHelper.BuildConferenceForTest(),
            _eventComponentHelper.BuildConferenceForTest()
        };
        _conferences.ForEach(x => { _eventComponentHelper.RegisterUsersForHubContext(x.Participants); });
    }

    [Test]
    public async Task should_notify_vho_when_allocated_hearings()
    {
        var csoUsername = "testvho@test.com";

        _eventComponentHelper.EventHubContextMock.Setup(x => x.Clients.Group(csoUsername))
            .Returns(_eventComponentHelper.EventHubClientMock.Object);

        await _sut.PushAllocationUpdatedEvent(csoUsername, _conferences);

        _eventComponentHelper.EventHubClientMock.Verify(
            x => x.AllocationsUpdated(It.IsAny<List<UpdatedAllocationDto>>()), Times.Once);
    }
}
