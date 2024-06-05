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
using VideoWeb.EventHub.Hub;
using VideoWeb.EventHub.Models;
using VideoWeb.Helpers;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.Helpers
{
    public class EndpointsUpdatedEventNotifierTests
    {
        private EndpointsUpdatedEventNotifier _notifier;
        private AutoMock _mocker;
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

            _mocker = AutoMock.GetLoose();
            var parameters = new ParameterBuilder(_mocker)
                .AddTypedParameters<RoomSummaryResponseMapper>()
                .Build();

            _mocker.Mock<IMapperFactory>()
                .Setup(x => x.Get<Endpoint, VideoEndpointResponse>())
                .Returns(_mocker.Create<VideoEndpointsResponseDtoMapper>(parameters));

            _notifier = new EndpointsUpdatedEventNotifier(_eventHelper.EventHubContextMock.Object, _mocker.Create<IMapperFactory>());
        }

        [Test]
        public async Task Should_send_event()
        {
            // Arrange
            var newEndpoint = new Endpoint
            {
                Id = Guid.NewGuid(),
                DisplayName = "NewEndpoint",
                EndpointParticipants = new List<EndpointParticipant>
                {
                    new()
                    {
                        ParticipantUsername =  "Endpoint1DefenceAdvocateUsername@gmail.com"
                    }
                }
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
            _eventHelper.EventHubClientMock.Verify(x
                => x.EndpointsUpdated(_conference.Id, It.IsAny<UpdateEndpointsDto>()), 
                Times.Exactly(_conference.Participants.Count));
        }
    }
}
