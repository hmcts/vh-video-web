using System.Net;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Request;
using VideoWeb.Controllers;
using VideoWeb.EventHub.Handlers.Core;
using VideoApi.Client;
using VideoApi.Contract.Responses;
using VideoApi.Contract.Requests;
using VideoWeb.UnitTests.Builders;
using EventHubEventType = VideoWeb.EventHub.Enums.EventType;
using Autofac.Extras.Moq;
using VideoWeb.Mappings;
using System.Collections.Generic;
using System.Threading;
using VideoWeb.Contract.Responses;
using VideoWeb.EventHub.Models;
using VideoApi.Contract.Enums;
using VideoWeb.Common;
using ParticipantResponse = VideoApi.Contract.Responses.ParticipantResponse;

namespace VideoWeb.UnitTests.Controllers.ParticipantController;

public class UpdateParticipantStatusTests
{
    private AutoMock _mocker;
    private ParticipantsController _sut;
    private Conference _testConference;
    
    [SetUp]
    public void Setup()
    {
        _mocker = AutoMock.GetLoose();
        var eventHandlerMock = _mocker.Mock<IEventHandler>();
        
        _mocker.Mock<IEventHandlerFactory>().Setup(x => x.Get(It.IsAny<EventHubEventType>())).Returns(eventHandlerMock.Object);
        
        var claimsPrincipal = new ClaimsPrincipalBuilder().Build();
        var eventComponentHelper = new EventComponentHelper();
        _testConference = EventComponentHelper.BuildConferenceForTest();
        _testConference.Participants[0].Username = ClaimsPrincipalBuilder.Username;
        
        var context = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = claimsPrincipal
            }
        };
        
        _sut = _mocker.Create<ParticipantsController>();
        _sut.ControllerContext = context;
        _mocker.Mock<IConferenceService>()
            .Setup(x => x.GetConference(_testConference.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(_testConference);
    }
    
    [Test]
    public async Task Should_return_ok()
    {
        var conferenceId = _testConference.Id;
        var request = new UpdateParticipantStatusEventRequest
        {
            EventType = EventType.Joined
        };
        _mocker.Mock<IVideoApiClient>()
            .Setup(x => x.RaiseVideoEventAsync(It.IsAny<ConferenceEventRequest>()))
            .Returns(Task.FromResult(default(object)));
        
        var result = await _sut.UpdateParticipantStatusAsync(conferenceId, request, CancellationToken.None);
        var typedResult = (NoContentResult) result;
        typedResult.Should().NotBeNull();
    }
    
    [Test]
    public async Task Should_call_api_when_cache_is_empty()
    {
        var conferenceId = _testConference.Id;
        var request = new UpdateParticipantStatusEventRequest
        {
            EventType = EventType.Joined
        };
        _mocker.Mock<IVideoApiClient>()
            .Setup(x => x.RaiseVideoEventAsync(It.IsAny<ConferenceEventRequest>()))
            .Returns(Task.FromResult(default(object)));
        
        await _sut.UpdateParticipantStatusAsync(conferenceId, request, CancellationToken.None);
        _mocker.Mock<IConferenceService>().Verify(x => x.GetConference(_testConference.Id, It.IsAny<CancellationToken>()), Times.Once);
    }
}
