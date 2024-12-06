using VideoApi.Contract.Responses;
using Microsoft.AspNetCore.SignalR;
using Moq;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FizzWare.NBuilder;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Request;
using VideoWeb.EventHub.Hub;
using VideoWeb.EventHub.Models;
using VideoWeb.Helpers;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.Helpers;

public class EndpointsUpdatedEventNotifierTests
{
    private EndpointsUpdatedEventNotifier _notifier;
    private Conference _conference;
    private EventComponentHelper _eventHelper;
    
    [SetUp]
    public void SetUp()
    {
        _conference = new ConferenceCacheModelBuilder().Build();
        _eventHelper = new EventComponentHelper
        {
            EventHubContextMock = new Mock<IHubContext<EventHub.Hub.EventHub, IEventHubClient>>(),
            EventHubClientMock = new Mock<IEventHubClient>()
        };
        // this will register all participants as connected to the hub
        _eventHelper.RegisterUsersForHubContext(_conference.Participants);
        
        _notifier = new EndpointsUpdatedEventNotifier(_eventHelper.EventHubContextMock.Object);
    }
    
    [Test]
    public async Task Should_send_event()
    {
        // Arrange
        var newEndpoint = new Endpoint
        {
            Id = Guid.NewGuid(),
            DisplayName = "NewEndpoint",
            DefenceAdvocateUsername = "endpointDefenceAdvocate"
        };
        
        var request = new UpdateConferenceEndpointsRequest()
        {
            ExistingEndpoints = new List<EndpointResponse>(),
            NewEndpoints = new List<EndpointResponse>()
            {
                new()
                {
                    Id = newEndpoint.Id,
                    DisplayName = newEndpoint.DisplayName
                }
            },
            RemovedEndpoints = new List<Guid>()
        };
        
        // Act
        await _notifier.PushEndpointsUpdatedEvent(_conference, request);
        
        // Assert
        const int staffMemberCount = 1;
        _eventHelper.EventHubClientMock.Verify(x => x.EndpointsUpdated(_conference.Id, It.IsAny<UpdateEndpointsDto>()),
            Times.Exactly(_conference.Participants.Count + staffMemberCount));
    }
    
    [Test]
    public async Task should_only_publish_one_message_to_staff_member_participants()
    {
        // Arrange
        var newEndpoint = new Endpoint
        {
            Id = Guid.NewGuid(),
            DisplayName = "NewEndpoint",
            DefenceAdvocateUsername = "endpointDefenceAdvocate"
        };
        
        var request = new UpdateConferenceEndpointsRequest()
        {
            ExistingEndpoints = new List<EndpointResponse>(),
            NewEndpoints = new List<EndpointResponse>()
            {
                new()
                {
                    Id = newEndpoint.Id,
                    DisplayName = newEndpoint.DisplayName
                }
            },
            RemovedEndpoints = new List<Guid>()
        };
        
        AddParticipantToConference(Role.StaffMember);

        // Act
        await _notifier.PushEndpointsUpdatedEvent(_conference, request);

        // Assert
        const int nonParticipantStaffMemberCount = 1; // Non-participant staff member = a staff member who is not a participant on the conference
        var nonStaffMemberParticipantCount = _conference.Participants.Count(p => p.Role != Role.StaffMember); // Non-staff member participants = participants minus staff members
        var expectedMessageCount = nonParticipantStaffMemberCount + nonStaffMemberParticipantCount;
        _eventHelper.EventHubClientMock.Verify(x => x.EndpointsUpdated(_conference.Id, It.IsAny<UpdateEndpointsDto>()), Times.Exactly(expectedMessageCount));
    }
    
    private void AddParticipantToConference(Role role)
    {
        var staffMemberParticipant = Builder<Participant>.CreateNew()
            .With(x => x.Role = role).With(x => x.Id = Guid.NewGuid())
            .With(x => x.Username = Faker.Internet.Email())
            .Build();

        _conference.Participants.Add(staffMemberParticipant);
        _eventHelper.RegisterParticipantForHubContext(staffMemberParticipant);
    }
}
