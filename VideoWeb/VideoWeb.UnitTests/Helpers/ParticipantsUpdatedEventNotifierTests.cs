using Autofac.Extras.Moq;
using Moq;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.EventHub.Enums;
using VideoWeb.EventHub.Handlers.Core;
using VideoWeb.EventHub.Hub;
using VideoWeb.EventHub.Models;
using VideoWeb.Helpers;
using VideoWeb.Mappings;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.Helpers;

class ParticipantsUpdatedEventNotifierTests
{
    private ParticipantsUpdatedEventNotifier _notifier;
    private Conference _conference;
    private Participant _participant1;
    private Participant _participant2;
    private EventComponentHelper _eventHelper;
    
    [SetUp]
    public void SetUp()
    {
        _eventHelper = new EventComponentHelper
        {
            EventHubContextMock = new Mock<IHubContext<EventHub.Hub.EventHub, IEventHubClient>>(),
            EventHubClientMock = new Mock<IEventHubClient>()
        };

        _conference = new ConferenceCacheModelBuilder().Build();
        _participant1 = _conference.Participants.Find(x => x.Role == Role.Individual);
        _participant2 = _conference.Participants.Find(x => x.Role == Role.Representative);

        
        _eventHelper.RegisterUsersForHubContext(_conference.Participants);

        _notifier = new ParticipantsUpdatedEventNotifier(_eventHelper.EventHubContextMock.Object,
            new Mock<ILogger<EventHandlerBase>>().Object);
    }
    
    [Test]
    public async Task Should_send_event()
    {
        // Arrange
        var participantsToNotify = _conference.Participants.Select(ParticipantDtoForResponseMapper.Map).ToList();
        
        // Act
        await _notifier.PushParticipantsUpdatedEvent(_conference, _conference.Participants);
        
        
        const int vhoCount = 1;
        const int nonParticipantStaffMemberCount = 1; // Non-participant staff member = a staff member who is not a participant on the conference
        var nonStaffMemberParticipantCount = _conference.Participants.Count(p => p.Role != Role.StaffMember); // Non-staff member participants = participants minus staff members
        var expectedMessageCount = nonParticipantStaffMemberCount + vhoCount + nonStaffMemberParticipantCount;
        
        _eventHelper.EventHubClientMock.Verify(
            x => x.ParticipantsUpdatedMessage(
                _conference.Id,
                It.Is<List<ParticipantResponse>>(list => ParticipantResponseListsMatch(list, participantsToNotify))),
            Times.Exactly(expectedMessageCount));
    }
    
    private static bool ParticipantResponseListsMatch(List<ParticipantResponse> list1, List<ParticipantResponse> list2)
    {
        return list1.Any(x => list2.Any(y => x.Id == y.Id)) &&
               list2.Any(x => list1.Any(y => x.Id == y.Id));
    }
}
