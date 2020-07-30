using System;
using System.Net;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Request;
using VideoWeb.Controllers;
using VideoWeb.EventHub.Handlers.Core;
using VideoWeb.Services.Bookings;
using VideoWeb.Services.Video;
using VideoWeb.UnitTests.Builders;
using ProblemDetails = VideoWeb.Services.Video.ProblemDetails;
using EventHubEventType = VideoWeb.EventHub.Enums.EventType;

namespace VideoWeb.UnitTests.Controllers.ParticipantController
{
    public class UpdateParticipantStatusTests
    {
        private ParticipantsController _controller;
        private Mock<IVideoApiClient> _videoApiClientMock;
        private Mock<IEventHandlerFactory> _eventHandlerFactoryMock;
        private Mock<IEventHandler> _eventHandlerMock;
        private readonly EventComponentHelper _eventComponentHelper = new EventComponentHelper();
        private Conference _testConference;
        private Mock<IConferenceCache> _conferenceCacheMock;
        private Mock<ILogger<ParticipantsController>> _mockLogger;
        private Mock<IBookingsApiClient> _bookingsApiClientMock;

        [SetUp]
        public void Setup()
        {
            _conferenceCacheMock = new Mock<IConferenceCache>();
            _videoApiClientMock = new Mock<IVideoApiClient>();
            _eventHandlerFactoryMock = new Mock<IEventHandlerFactory>();
            _eventHandlerMock = new Mock<IEventHandler>();
            _mockLogger = new Mock<ILogger<ParticipantsController>>();
            _bookingsApiClientMock = new Mock<IBookingsApiClient>();

            _eventHandlerFactoryMock.Setup(x => x.Get(It.IsAny<EventHubEventType>())).Returns(_eventHandlerMock.Object);
            
            var claimsPrincipal = new ClaimsPrincipalBuilder().Build();
            _testConference = _eventComponentHelper.BuildConferenceForTest();
            _testConference.Participants[0].Username = ClaimsPrincipalBuilder.Username;

            var context = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = claimsPrincipal
                }
            };
            
            _controller = new ParticipantsController(_videoApiClientMock.Object, _eventHandlerFactoryMock.Object, 
                _conferenceCacheMock.Object, _mockLogger.Object, _bookingsApiClientMock.Object)
            {
                ControllerContext = context
            };
        }

        [Test]
        public async Task Should_return_ok()
        {
            _conferenceCacheMock.Setup(cache => cache.GetOrAddConferenceAsync(_testConference.Id, It.IsAny<Func<Task<ConferenceDetailsResponse>>>()))
                .Callback(async (Guid anyGuid, Func<Task<ConferenceDetailsResponse>> factory) => await factory())
                .ReturnsAsync(_testConference);
            
            var conferenceId = _testConference.Id;
            var request = new UpdateParticipantStatusEventRequest
            {
                EventType = EventType.Joined
            };
            _videoApiClientMock
                .Setup(x => x.RaiseVideoEventAsync(It.IsAny<ConferenceEventRequest>()))
                .Returns(Task.FromResult(default(object)));
            
            var result = await _controller.UpdateParticipantStatusAsync(conferenceId, request);
            var typedResult = (NoContentResult) result;
            typedResult.Should().NotBeNull();
        }
        
        [Test]
        public async Task Should_call_api_when_cache_is_empty()
        {
            _conferenceCacheMock.Setup(cache => cache.GetOrAddConferenceAsync(_testConference.Id, It.IsAny<Func<Task<ConferenceDetailsResponse>>>()))
                .Callback(async (Guid anyGuid, Func<Task<ConferenceDetailsResponse>> factory) => await factory())
                .ReturnsAsync(_testConference);
            
            var conferenceId = _testConference.Id;
            var request = new UpdateParticipantStatusEventRequest
            {
                EventType = EventType.Joined
            };
            _videoApiClientMock
                .Setup(x => x.RaiseVideoEventAsync(It.IsAny<ConferenceEventRequest>()))
                .Returns(Task.FromResult(default(object)));
            
            await _controller.UpdateParticipantStatusAsync(conferenceId, request);
            _videoApiClientMock.Verify(x => x.GetConferenceDetailsByIdAsync(_testConference.Id), Times.Once);
        }

        [Test]
        public async Task Should_throw_error_when_get_api_throws_error()
        {
            _conferenceCacheMock.Setup(cache => cache.GetOrAddConferenceAsync(_testConference.Id, It.IsAny<Func<Task<ConferenceDetailsResponse>>>()))
                .Callback(async (Guid anyGuid, Func<Task<ConferenceDetailsResponse>> factory) => await factory())
                .ReturnsAsync(_testConference);
            
            var conferenceId = _testConference.Id;
            var request = new UpdateParticipantStatusEventRequest
            {
                EventType = EventType.Joined
            };
            var apiException = new VideoApiException<ProblemDetails>("Bad Request", (int) HttpStatusCode.BadRequest,
                "Please provide a valid conference Id", null, default, null);
            _videoApiClientMock
                .Setup(x => x.RaiseVideoEventAsync(It.IsAny<ConferenceEventRequest>()))
                .ThrowsAsync(apiException);

            var result = await _controller.UpdateParticipantStatusAsync(conferenceId, request);
            var typedResult = (ObjectResult)result;
            typedResult.StatusCode.Should().Be((int)HttpStatusCode.BadRequest);
        }
    }
}
