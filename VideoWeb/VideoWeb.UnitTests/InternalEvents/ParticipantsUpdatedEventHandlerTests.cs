using System;
using System.Linq;
using System.Threading.Tasks;
using FizzWare.NBuilder;
using Microsoft.AspNetCore.SignalR;
using Moq;
using NUnit.Framework;
using VideoWeb.Common.Models;
using VideoWeb.EventHub.Hub;
using VideoWeb.EventHub.InternalHandlers;
using VideoWeb.EventHub.InternalHandlers.Models;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.InternalEvents;

public class ParticipantsUpdatedEventHandlerTests
{
    private ParticipantsUpdatedEventHandler _sut;
    private Conference _conference;
    private EventComponentHelper _eventComponentHelper;

    [SetUp]
    public void SetUp()
    {
        _conference = new ConferenceCacheModelBuilder().Build();
        _eventComponentHelper = new EventComponentHelper
        {
            EventHubContextMock = new Mock<IHubContext<EventHub.Hub.EventHub, IEventHubClient>>(),
            EventHubClientMock = new Mock<IEventHubClient>()
        };
        _sut = new ParticipantsUpdatedEventHandler(_eventComponentHelper.EventHubContextMock.Object);
        _eventComponentHelper.RegisterUsersForHubContext(_conference.Participants);
    }

    [Test]
    public async Task should_notify_vho_and_participants_when_participants_updated()
    {
        var newParticipant = Builder<Participant>.CreateNew().With(x => x.Role = Role.Individual)
            .With(x => x.Id = Guid.NewGuid()).Build();

        var participantToRemove = _conference.Participants.First(x => x.Role == Role.Individual);
        _conference.Participants.Remove(participantToRemove);
        _conference.Participants.Add(newParticipant);
        
        var participantCount = _conference.Participants.Count;
        var updatedParticipants = _conference.Participants.Select(x => new Contract.Responses.ParticipantResponse
        {
            Id = x.Id,
            UserName = x.Username,
            DisplayName = x.DisplayName,
            Role = x.Role,
            Name = x.Name
        }).ToList();
        
        var dto = new ParticipantsUpdatedEventDto
        {
            ConferenceId = _conference.Id,
            Participants = updatedParticipants
        };

        await _sut.HandleAsync(dto);

        // participants + VHO
        _eventComponentHelper.EventHubClientMock.Verify(
            x => x.ParticipantsUpdatedMessage(_conference.Id, updatedParticipants), Times.Exactly(participantCount + 1));
    }
}
