using System;
using Moq;
using NUnit.Framework;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using VideoWeb.Common;
using VideoWeb.Common.Models;
using VideoWeb.EventHub.Hub;
using VideoWeb.EventHub.Models;
using VideoWeb.Helpers;
using VideoWeb.Helpers.Interfaces;
using VideoWeb.Mappings;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.Helpers;

internal class AllocationHearingsEventNotifierTests
{
    private AllocationHearingsEventNotifier _notifier;
    private Conference _conference;
    private EventComponentHelper _eventHelper;
    private const string CsoUserName = "username@email.com";
    private Guid CsoId = Guid.NewGuid();

    [SetUp]
    public void SetUp()
    {
        _conference = new ConferenceCacheModelBuilder().Build();
        _eventHelper = new EventComponentHelper
        {
            EventHubContextMock = new Mock<IHubContext<EventHub.Hub.EventHub, IEventHubClient>>(),
            EventHubClientMock = new Mock<IEventHubClient>(),
            ConferenceServiceMock = new Mock<IConferenceService>()
        };
        _eventHelper.ConferenceServiceMock
            .Setup(x => x.GetConferences(It.IsAny<List<Guid>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([_conference]);

        // this will register all participants as connected to the hub
        _eventHelper.RegisterUsersForHubContext(_conference.Participants);
        _eventHelper.RegisterParticipantForHubContext(CsoUserName);
        _notifier = new AllocationHearingsEventNotifier(_eventHelper.EventHubContextMock.Object,
            _eventHelper.ConferenceServiceMock.Object);
    }

    [Test]
    public async Task Should_send_event()
    {
        // Act
        var update = new UpdatedAllocationJusticeUserDto(CsoUserName, CsoId);
        await _notifier.PushAllocationHearingsEvent(update, [_conference.Id]);

        List<UpdatedAllocationDto> expected =
            [ConferenceDetailsToUpdatedAllocationDtoMapper.MapToUpdatedAllocationDto(_conference)];

        _eventHelper.EventHubClientMock.Verify(x => x.AllocationsUpdated(expected), Times.Once);
    }
    
    [Test]
    public async Task Should_not_send_event_when_hearings_is_empty()
    {
        // arrange
        var conferences = Enumerable.Empty<Guid>().ToList();
        
        // act
        var update = new UpdatedAllocationJusticeUserDto(CsoUserName, CsoId);
        await _notifier.PushAllocationHearingsEvent(update, conferences);
        
        // assert
        _eventHelper.EventHubClientMock.Verify(x => x.AllocationsUpdated(It.IsAny<List<UpdatedAllocationDto>>()),
            Times.Never);
    }

    [Test]
    public async Task Should_send_event_to_new_and_previously_allocated_cso()
    {
        // arrange
        const string newCsoUsername = CsoUserName;
        const string previousCsoUsername = "previous-cso@email.com";
        _conference.AllocatedCso = previousCsoUsername;
        _conference.AllocatedCsoId = Guid.NewGuid();
        _eventHelper.RegisterParticipantForHubContext(previousCsoUsername);
        var update = new UpdatedAllocationJusticeUserDto(newCsoUsername, CsoId);

        // act
        await _notifier.PushAllocationHearingsEvent(update, [_conference.Id]);

        // assert
        List<UpdatedAllocationDto> expectedContent =
            [ConferenceDetailsToUpdatedAllocationDtoMapper.MapToUpdatedAllocationDto(_conference)];
        
        _eventHelper.EventHubClientMock.Verify(x => x.AllocationsUpdated(expectedContent), Times.Exactly(2));
    }
}
