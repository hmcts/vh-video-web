using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Autofac.Extras.Moq;
using Moq;
using NUnit.Framework;
using VideoWeb.Helpers.Interfaces;

namespace VideoWeb.UnitTests.Controllers.InternalEventController
{
    public class EndpointRepUpdatedTests
    {
        private AutoMock _mocker;
        private VideoWeb.Controllers.InternalEventController _controller;
        private const string endpoint = "JvsEndpoint";
        private const string participant = "participant-username@hearings.reform.hmcts";
        private Guid conference;
        private Mock<IEndpointsUpdatedEventNotifier> _endpointsUpdatedEventNotifier;
        
        [SetUp]
        public void Setup()
        {
            _mocker = AutoMock.GetLoose();
            _endpointsUpdatedEventNotifier = _mocker.Mock<IEndpointsUpdatedEventNotifier>();
            _controller = _mocker.Create<VideoWeb.Controllers.InternalEventController>();
            
        }

        [Test]
        public async Task PushUnlinkedParticipantFromEndpoint()
        {
            conference = Guid.NewGuid();
            await _controller.PushUnlinkedParticipantFromEndpoint(conference, participant, endpoint);
            _endpointsUpdatedEventNotifier
                .Verify(e => e.PushUnlinkedParticipantFromEndpoint(conference, participant, endpoint), Times.Once);
        }

        [Test]
        public async Task PushLinkedNewParticipantToEndpoint()
        {
            conference = Guid.NewGuid();
            await _controller.PushLinkedNewParticipantToEndpoint(conference, participant, endpoint);
            _endpointsUpdatedEventNotifier
                .Verify(e => e.PushLinkedNewParticipantToEndpoint(conference, participant, endpoint), Times.Once);
        }


        [Test]
        public async Task PushCloseConsultationBetweenEndpointAndParticipant()
        {
            conference = Guid.NewGuid();
            await _controller.PushCloseConsultationBetweenEndpointAndParticipant(conference, participant, endpoint);
            _endpointsUpdatedEventNotifier
                .Verify(e => e.PushCloseConsultationBetweenEndpointAndParticipant(conference, participant, endpoint), Times.Once);
        }

    }
}
