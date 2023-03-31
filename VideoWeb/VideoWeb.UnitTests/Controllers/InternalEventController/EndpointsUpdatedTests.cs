using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Autofac.Extras.Moq;
using BookingsApi.Contract.Requests;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using VideoApi.Client;
using VideoApi.Contract.Requests;
using VideoApi.Contract.Responses;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Request;
using VideoWeb.Controllers;
using VideoWeb.Helpers.Interfaces;
using VideoWeb.Mappings;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.Controllers.InternalEventControllerTests
{
    public class EndpointsUpdatedTests
    {
        private AutoMock _mocker;
        protected InternalEventController _controller;

        private Guid testConferenceId;
        private Guid existingEndpointId;

        private Mock<Conference> mockConference;
        private Mock<UpdateConferenceEndpointsRequest> mockUpdateConferenceEndpointsRequest;

        [SetUp]
        public void Setup()
        {
            _mocker = AutoMock.GetLoose();
            var claimsPrincipal = new ClaimsPrincipalBuilder().WithRole("Judge").Build();
            var context = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = claimsPrincipal
                }
            };

            var parameters = new ParameterBuilder(_mocker)
                .AddTypedParameters<EndpointsResponseMapper>()
                .Build();

            _controller = _mocker.Create<InternalEventController>();
            _controller.ControllerContext = context;

            testConferenceId = Guid.NewGuid();
            existingEndpointId = Guid.NewGuid();

            mockConference = _mocker.Mock<Conference>();
            mockConference.Object.Id = testConferenceId;

            mockUpdateConferenceEndpointsRequest = _mocker.Mock<UpdateConferenceEndpointsRequest>();
            mockUpdateConferenceEndpointsRequest.Object.NewEndpoints = new List<EndpointResponse> 
            {
                new EndpointResponse 
                {
                    Id = existingEndpointId,
                    DisplayName = "TestDisplayName"
                }
            };

            _mocker.Mock<IConferenceCache>()
                .Setup(x => x.GetOrAddConferenceAsync(It.Is<Guid>(id => id == testConferenceId),
                    It.IsAny<Func<Task<ConferenceDetailsResponse>>>()))
                .ReturnsAsync(mockConference.Object);
        }

        [Test]
        public async Task Should_send_event()
        {
            // Arrange
            var updateEndpointsRequest = mockUpdateConferenceEndpointsRequest.Object;

            // Act
            var result = await _controller.EndpointsUpdated(testConferenceId, updateEndpointsRequest);

            // Assert
            result.Should().BeOfType<NoContentResult>();

            _mocker.Mock<IEndpointsUpdatedEventNotifier>().Verify(x => x.PushEndpointsUpdatedEvent(mockConference.Object, updateEndpointsRequest), Times.Once);
        }

        [Test]
        public async Task Should_not_send_event_if_exception_thrown()
        {
            // Arrange
            _mocker.Mock<IEndpointsUpdatedEventNotifier>().Setup(x =>
                    x.PushEndpointsUpdatedEvent(mockConference.Object, mockUpdateConferenceEndpointsRequest.Object))
                .Throws(new VideoApiException("error", StatusCodes.Status500InternalServerError, "", null, null));

            // Act
            var result = await _controller.EndpointsUpdated(testConferenceId, mockUpdateConferenceEndpointsRequest.Object);

            // Assert
            result.Should().BeOfType<ObjectResult>();
            var typedResult = (ObjectResult)result;
            typedResult.Should().NotBeNull();
            typedResult.StatusCode.Should().Be(StatusCodes.Status500InternalServerError);

            _mocker.Mock<IEndpointsUpdatedEventNotifier>().Verify(x => x.PushEndpointsUpdatedEvent(mockConference.Object, mockUpdateConferenceEndpointsRequest.Object), Times.Once);
        }

        [Test]
        public async Task Should_call_api_when_cache_is_empty()
        {
            _mocker.Mock<IConferenceCache>().Setup(cache => cache.GetOrAddConferenceAsync(mockConference.Object.Id, It.IsAny<Func<Task<ConferenceDetailsResponse>>>()))
                .Callback(async (Guid anyGuid, Func<Task<ConferenceDetailsResponse>> factory) => await factory())
                .ReturnsAsync(mockConference.Object);

            var result = await _controller.EndpointsUpdated(testConferenceId, mockUpdateConferenceEndpointsRequest.Object);
            
            result.Should().BeOfType<NoContentResult>();
            _mocker.Mock<IConferenceCache>().Verify(x => x.GetOrAddConferenceAsync(testConferenceId, It.IsAny<Func<Task<ConferenceDetailsResponse>>>()), Times.Once);
            _mocker.Mock<IVideoApiClient>().Verify(x => x.GetConferenceDetailsByIdAsync(testConferenceId), Times.Once);
        }
    }    
}
