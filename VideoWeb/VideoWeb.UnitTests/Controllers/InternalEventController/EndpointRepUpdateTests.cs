using System;
using System.Threading.Tasks;
using Autofac.Extras.Moq;
using Moq;
using NUnit.Framework;
using VideoWeb.Helpers.Interfaces;

namespace VideoWeb.UnitTests.Controllers.InternalEventController;

public class EndpointRepUpdatedTests
{
    private AutoMock _mocker;
    private VideoWeb.Controllers.InternalEventControllers.InternalEventParticipantController _participantController;
    private const string Endpoint = "JvsEndpoint";
    private const string Participant = "participant-username@hearings.reform.hmcts";
    private Guid _conference;
    private Mock<IEndpointsUpdatedEventNotifier> _endpointsUpdatedEventNotifier;
    
    [SetUp]
    public void Setup()
    {
        _mocker = AutoMock.GetLoose();
        _endpointsUpdatedEventNotifier = _mocker.Mock<IEndpointsUpdatedEventNotifier>();
        _participantController = _mocker.Create<VideoWeb.Controllers.InternalEventControllers.InternalEventParticipantController>();
        
    }
    
    [Test]
    public async Task PushUnlinkedParticipantFromEndpoint()
    {
        _conference = Guid.NewGuid();
        await _participantController.PushUnlinkedParticipantFromEndpoint(_conference, Participant, Endpoint);
        _endpointsUpdatedEventNotifier
            .Verify(e => e.PushUnlinkedParticipantFromEndpoint(_conference, Participant, Endpoint), Times.Once);
    }
    
    [Test]
    public async Task PushLinkedNewParticipantToEndpoint()
    {
        _conference = Guid.NewGuid();
        await _participantController.PushLinkedNewParticipantToEndpoint(_conference, Participant, Endpoint);
        _endpointsUpdatedEventNotifier
            .Verify(e => e.PushLinkedNewParticipantToEndpoint(_conference, Participant, Endpoint), Times.Once);
    }
    
    
    [Test]
    public async Task PushCloseConsultationBetweenEndpointAndParticipant()
    {
        _conference = Guid.NewGuid();
        await _participantController.PushCloseConsultationBetweenEndpointAndParticipant(_conference, Participant, Endpoint);
        _endpointsUpdatedEventNotifier
            .Verify(e => e.PushCloseConsultationBetweenEndpointAndParticipant(_conference, Participant, Endpoint), Times.Once);
    }
    
}
