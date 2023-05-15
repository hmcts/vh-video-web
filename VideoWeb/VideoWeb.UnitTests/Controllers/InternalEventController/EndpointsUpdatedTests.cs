using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Autofac.Extras.Moq;
using FizzWare.NBuilder;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using VideoApi.Client;
using VideoApi.Contract.Responses;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Request;
using VideoWeb.Helpers.Interfaces;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.Controllers.InternalEventController
{
    public class EndpointsUpdatedTests
    {
        private AutoMock _mocker;
        private VideoWeb.Controllers.InternalEventController _controller;

        private Conference _conference;

        [SetUp]
        public void Setup()
        {
            _conference = new ConferenceCacheModelBuilder().Build();
            _mocker = AutoMock.GetLoose();
            var claimsPrincipal = new ClaimsPrincipalBuilder().WithRole("Judge").Build();
            var context = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = claimsPrincipal
                }
            };

            _controller = _mocker.Create<VideoWeb.Controllers.InternalEventController>();
            _controller.ControllerContext = context;

            _mocker.Mock<IConferenceCache>()
                .Setup(x => x.GetOrAddConferenceAsync(It.Is<Guid>(id => id == _conference.Id),
                    It.IsAny<Func<Task<ConferenceDetailsResponse>>>()))
                .ReturnsAsync(_conference);
        }

        [Test]
        public async Task Should_send_event()
        {
            // Arrange
            var newEndpointsList = new List<EndpointResponse>
            {
                Builder<EndpointResponse>.CreateNew().Build()
            };
            var updateEndpointsRequest = Builder<UpdateConferenceEndpointsRequest>.CreateNew()
                .With(x => x.ExistingEndpoints, new List<EndpointResponse>())
                .With(x => x.RemovedEndpoints, new List<Guid>())
                .With(x => x.NewEndpoints, newEndpointsList).Build();

            // Act
            var result = await _controller.EndpointsUpdated(_conference.Id, updateEndpointsRequest);

            // Assert
            result.Should().BeOfType<NoContentResult>();

            _mocker.Mock<IEndpointsUpdatedEventNotifier>()
                .Verify(x => x.PushEndpointsUpdatedEvent(_conference, updateEndpointsRequest), Times.Once);
        }

        [Test]
        public async Task Should_not_send_event_if_exception_thrown()
        {
            // Arrange
            var newEndpointsList = new List<EndpointResponse>
            {
                Builder<EndpointResponse>.CreateNew().Build()
            };
            var updateEndpointsRequest = Builder<UpdateConferenceEndpointsRequest>.CreateNew()
                .With(x => x.ExistingEndpoints, new List<EndpointResponse>())
                .With(x => x.RemovedEndpoints, new List<Guid>())
                .With(x => x.NewEndpoints, newEndpointsList).Build();

            _mocker.Mock<IEndpointsUpdatedEventNotifier>().Setup(x =>
                    x.PushEndpointsUpdatedEvent(_conference, updateEndpointsRequest))
                .Throws(new VideoApiException("error", StatusCodes.Status500InternalServerError, "", null, null));

            // Act
            var result = await _controller.EndpointsUpdated(_conference.Id, updateEndpointsRequest);

            // Assert
            result.Should().BeOfType<ObjectResult>();
            var typedResult = (ObjectResult) result;
            typedResult.Should().NotBeNull();
            typedResult.StatusCode.Should().Be(StatusCodes.Status500InternalServerError);

            _mocker.Mock<IEndpointsUpdatedEventNotifier>().Verify(
                x => x.PushEndpointsUpdatedEvent(_conference, It.IsAny<UpdateConferenceEndpointsRequest>()),
                Times.Once);
        }

        [Test]
        public async Task Should_call_api_when_cache_is_empty()
        {
            var newEndpointsList = new List<EndpointResponse>
            {
                Builder<EndpointResponse>.CreateNew().Build()
            };
            var updateEndpointsRequest = Builder<UpdateConferenceEndpointsRequest>.CreateNew()
                .With(x => x.ExistingEndpoints, new List<EndpointResponse>())
                .With(x => x.RemovedEndpoints, new List<Guid>())
                .With(x => x.NewEndpoints, newEndpointsList).Build();

            _mocker.Mock<IConferenceCache>().Setup(cache =>
                    cache.GetOrAddConferenceAsync(_conference.Id, It.IsAny<Func<Task<ConferenceDetailsResponse>>>()))
                .Callback(async (Guid anyGuid, Func<Task<ConferenceDetailsResponse>> factory) => await factory())
                .ReturnsAsync(_conference);

            var result = await _controller.EndpointsUpdated(_conference.Id, updateEndpointsRequest);

            result.Should().BeOfType<NoContentResult>();
            _mocker.Mock<IConferenceCache>()
                .Verify(
                    x => x.GetOrAddConferenceAsync(_conference.Id, It.IsAny<Func<Task<ConferenceDetailsResponse>>>()),
                    Times.Once);
            _mocker.Mock<IVideoApiClient>().Verify(x => x.GetConferenceDetailsByIdAsync(_conference.Id), Times.Once);
        }
    }
}
