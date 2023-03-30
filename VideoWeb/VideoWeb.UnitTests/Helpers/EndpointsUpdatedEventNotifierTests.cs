using Autofac.Extras.Moq;
using VideoApi.Contract.Responses;
using Microsoft.AspNetCore.SignalR;
using Moq;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Request;
using VideoWeb.EventHub.Enums;
using VideoWeb.EventHub.Handlers.Core;
using VideoWeb.EventHub.Hub;
using VideoWeb.EventHub.Models;
using VideoWeb.Helpers;
using VideoWeb.Mappings.Interfaces;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.Helpers
{
    public class EndpointsUpdatedEventNotifierTests
    {
        private EndpointsUpdatedEventNotifier _notifier;
        private EndpointsResponseMapper _sut;
        private AutoMock _mocker;
        private Conference _conference;
        private Endpoint _endpoint1;
        private EndpointResponse _endpointResponse1;
        private EndpointResponse _endpointResponse2;
        private Mock<UpdateConferenceEndpointsRequest> _mockUpdateConferenceEndpointsRequest;

        [SetUp]
        public void SetUp()
        {
            _mocker = AutoMock.GetLoose();
            var parameters = new ParameterBuilder(_mocker)
                .AddTypedParameters<EndpointsResponseMapper>()
                .Build();

            _sut = _mocker.Create<EndpointsResponseMapper>(parameters);

            _mocker.Mock<IHubClients<IEventHubClient>>()
                .Setup(x => x.Group(It.IsAny<string>()))
                .Returns(_mocker.Mock<IEventHubClient>().Object);

            _mocker.Mock<IHubContext<EventHub.Hub.EventHub, IEventHubClient>>()
                .Setup(x => x.Clients)
                .Returns(_mocker.Mock<IHubClients<IEventHubClient>>().Object);

            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<EndpointResponse, int, VideoEndpointResponse>())
                .Returns(_sut);

            _notifier = _mocker.Create<EndpointsUpdatedEventNotifier>(parameters);

            _endpoint1 = new Endpoint
            {
                Id = Guid.NewGuid(),
                DisplayName = "Endpoint1DisplayName",
                DefenceAdvocateUsername = "Endpoint1DefenceAdvocateUsername@gmail.com"
            };

            _conference = new Conference
            {
                Id = Guid.NewGuid(),
                Participants = new List<Participant>
                { 
                    new Participant
                    {
                        Id = Guid.NewGuid(),
                        Username = "username@gmail.com",
                        DisplayName = "displayname",
                        ParticipantStatus = ParticipantStatus.Available,
                        CaseTypeGroup = "Judge"
                    }
                },
                Endpoints = new List<Endpoint> 
                {
                    _endpoint1
                }
            };

            _endpointResponse1 = new EndpointResponse
            {
                Id = Guid.NewGuid(),
                DisplayName = "TestDisplayName"
            };

            _endpointResponse2 = new EndpointResponse
            {
                Id = _endpoint1.Id,
                DisplayName = "TestDisplayName"
            };

            _mockUpdateConferenceEndpointsRequest = _mocker.Mock<UpdateConferenceEndpointsRequest>();
            _mockUpdateConferenceEndpointsRequest.Object.NewEndpoints = new List<EndpointResponse>
            {
                _endpointResponse1
            };
            _mockUpdateConferenceEndpointsRequest.Object.ExistingEndpoints = new List<EndpointResponse>
            {
                _endpointResponse2
            };
        }

        [Test]
        public async Task Should_send_event()
        {
            // Arrange

            // Act
            await _notifier.PushEndpointsUpdatedEvent(_conference, _mockUpdateConferenceEndpointsRequest.Object);

            _mocker.Mock<IEventHubClient>().Verify(
                x => x.EndpointsUpdated(_conference.Id, It.IsAny<UpdateEndpointsDto>()),
                Times.Once);
        }
    }
}
