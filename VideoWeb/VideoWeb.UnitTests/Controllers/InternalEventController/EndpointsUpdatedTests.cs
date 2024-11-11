using System;
using System.Collections.Generic;
using System.Threading;
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
using VideoWeb.Common;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Request;
using VideoWeb.Helpers.Interfaces;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.Controllers.InternalEventController;

public class EndpointsUpdatedTests
{
    private AutoMock _mocker;
    private VideoWeb.Controllers.InternalEventControllers.InternalEventParticipantController _participantController;
    
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
        
        _participantController = _mocker.Create<VideoWeb.Controllers.InternalEventControllers.InternalEventParticipantController>();
        _participantController.ControllerContext = context;
        
        _mocker.Mock<IConferenceService>()
            .Setup(x => x.ForceGetConference(It.Is<Guid>(id => id == _conference.Id), It.IsAny<CancellationToken>()))
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
        var result = await _participantController.EndpointsUpdated(_conference.Id, updateEndpointsRequest);
        
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
        var result = await _participantController.EndpointsUpdated(_conference.Id, updateEndpointsRequest);
        
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
        
        
        _mocker.Mock<IConferenceService>()
            .Setup(x => x.GetConference(It.Is<Guid>(id => id == _conference.Id), It.IsAny<CancellationToken>()))
            .ReturnsAsync(_conference);
        
        var result = await _participantController.EndpointsUpdated(_conference.Id, updateEndpointsRequest);
        
        result.Should().BeOfType<NoContentResult>();
        _mocker.Mock<IConferenceService>().Verify(x => x.ForceGetConference(_conference.Id,It.IsAny<CancellationToken>()), Times.Once);
    }
}
