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
    private const string CsoName = "CSO Name";
    private readonly Guid _csoId = Guid.NewGuid();

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
        var update = new UpdatedAllocationJusticeUserDto(CsoUserName, _csoId, CsoName);
        await _notifier.PushAllocationHearingsEvent(update, [_conference.Id]);

        List<UpdatedAllocationDto> expected =
            [ConferenceDetailsToUpdatedAllocationDtoMapper.MapToUpdatedAllocationDto(_conference)];
        
        _eventHelper.EventHubClientMock.Verify(
            x => x.AllocationsUpdated(It.Is<List<UpdatedAllocationDto>>(list => 
                list.Count == 1 &&
                list[0].ConferenceId == expected[0].ConferenceId &&
                list[0].ScheduledDateTime == expected[0].ScheduledDateTime &&
                list[0].CaseName == expected[0].CaseName &&
                list[0].JudgeDisplayName == expected[0].JudgeDisplayName &&
                list[0].AllocatedToCsoUsername == expected[0].AllocatedToCsoUsername &&
                list[0].AllocatedToCsoDisplayName == expected[0].AllocatedToCsoDisplayName &&
                list[0].AllocatedToCsoId == expected[0].AllocatedToCsoId)),
            Times.Exactly(1));
    }
    
    [Test]
    public async Task Should_not_send_event_when_hearings_is_empty()
    {
        // arrange
        var conferences = Enumerable.Empty<Guid>().ToList();
        
        // act
        var update = new UpdatedAllocationJusticeUserDto(CsoUserName, _csoId, CsoName);
        await _notifier.PushAllocationHearingsEvent(update, conferences);
        
        // assert
        _eventHelper.EventHubClientMock.Verify(x => x.AllocationsUpdated(It.IsAny<List<UpdatedAllocationDto>>()),
            Times.Never);
    }
}
