using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using Autofac.Extras.Moq;
using FizzWare.NBuilder;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoWeb.Controllers;
using VideoWeb.EventHub.Handlers.Core;
using VideoWeb.EventHub.Models;
using VideoWeb.Mappings;
using VideoWeb.Services.Video;
using VideoWeb.UnitTests.Builders;
using Endpoint = VideoWeb.Common.Models.Endpoint;
using ProblemDetails = VideoWeb.Services.Video.ProblemDetails;
using RoomType = VideoWeb.Services.Video.RoomType;

namespace VideoWeb.UnitTests.Controllers.VideoEventController
{
    public class SendHearingEventTests
    {
        private VideoEventsController _sut;
        private Conference _testConference;
        private AutoMock _mocker;

        [SetUp]
        public void Setup()
        {
            _mocker = AutoMock.GetLoose();

            _testConference = BuildConferenceForTest();
            
            var claimsPrincipal = new ClaimsPrincipalBuilder().Build();
            var context = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = claimsPrincipal
                }
            };

            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<ConferenceEventRequest, Conference, CallbackEvent>()).Returns(_mocker.Create<CallbackEventMapper>());
            _sut = _mocker.Create<VideoEventsController>();
            _sut.ControllerContext = context;

            var conference = CreateValidConferenceResponse(null);
            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.GetConferenceDetailsByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(conference);
            _mocker.Mock<IConferenceCache>().Setup(cache => cache.GetOrAddConferenceAsync(_testConference.Id, It.IsAny<Func<Task<ConferenceDetailsResponse>>>()))
                .Callback(async (Guid anyGuid, Func<Task<ConferenceDetailsResponse>> factory) => await factory())
                .ReturnsAsync(_testConference);
            _mocker.Mock<IEventHandlerFactory>().Setup(x => x.Get(It.IsAny<EventHub.Enums.EventType>())).Returns(_mocker.Mock<IEventHandler>().Object);
        }

        [Test]
        public async Task Should_return_no_content_when_event_is_sent()
        {
            // Arrange
            var request = CreateRequest();

            // Act
            var result = await _sut.SendHearingEventAsync(request);

            // Assert
            _mocker.Mock<IEventHandler>().Verify(x => x.HandleAsync(It.IsAny<CallbackEvent>()), Times.Once);
            result.Should().BeOfType<NoContentResult>();
            var typedResult = (NoContentResult) result;
            typedResult.Should().NotBeNull();
        }

        [Test]
        public async Task Should_return_no_content_phone_shouldnt_call_handler()
        {
            // Arrange
            var request = CreateRequest("0123456789");

            // Act
            var result = await _sut.SendHearingEventAsync(request);

            // Assert
            _mocker.Mock<IEventHandler>().Verify(x => x.HandleAsync(It.IsAny<CallbackEvent>()), Times.Never);
            result.Should().BeOfType<NoContentResult>();
            var typedResult = (NoContentResult)result;
            typedResult.Should().NotBeNull();
        }

        [TestCase(EventType.Joined, EventType.EndpointJoined)]
        [TestCase(EventType.Disconnected, EventType.EndpointDisconnected)]
        [TestCase(EventType.Transfer, EventType.EndpointTransfer)]
        public async Task Should_return_no_content_when_endpoint_event_is_sent(EventType incomingEventType,
            EventType expectedEventType)
        {
            // Arrange
            var request = CreateEndpointRequest(incomingEventType);

            // Act
            var result = await _sut.SendHearingEventAsync(request);
            
            // Assert
            result.Should().BeOfType<NoContentResult>();
            var typedResult = (NoContentResult) result;
            typedResult.Should().NotBeNull();
            _mocker.Mock<IEventHandler>().Verify(x => x.HandleAsync(It.IsAny<CallbackEvent>()), Times.Once);
            _mocker.Mock<IVideoApiClient>().Verify(x =>
                x.RaiseVideoEventAsync(It.Is<ConferenceEventRequest>(r => r.Event_type == expectedEventType)));
        }

        [Test]
        public async Task Should_return_bad_request()
        { 
            // Arrange
            var apiException = new VideoApiException<ProblemDetails>("Bad Request", (int) HttpStatusCode.BadRequest,
                "Please provide a valid conference Id", null, default, null);
            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.RaiseVideoEventAsync(It.IsAny<ConferenceEventRequest>()))
                .ThrowsAsync(apiException);
            var request = CreateRequest();

            // Act
            var result = await _sut.SendHearingEventAsync(request);

            // Assert
            result.Should().BeOfType<ObjectResult>();
            var typedResult = (ObjectResult)result;
            typedResult.StatusCode.Should().Be((int) HttpStatusCode.BadRequest);
        }
        
        [Test]
        public async Task Should_return_exception()
        {
            // Arrange
            var apiException = new VideoApiException<ProblemDetails>("Internal Server Error", (int) HttpStatusCode.InternalServerError,
                "Stacktrace goes here", null, default, null);
            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.RaiseVideoEventAsync(It.IsAny<ConferenceEventRequest>()))
                .ThrowsAsync(apiException);
            var request = CreateRequest();

            // Act
            var result = await _sut.SendHearingEventAsync(request);

            // Assert
            result.Should().BeOfType<ObjectResult>();
            var typedResult = (ObjectResult) result;
            typedResult.Should().NotBeNull();
        }
        
        [Test]
        public async Task Should_return_exception_when_cache_func_throws_video_exception()
        {
            // Arrange
            var apiException = new VideoApiException<ProblemDetails>("Internal Server Error", (int) HttpStatusCode.InternalServerError,
                "Stacktrace goes here", null, default, null);
            _mocker.Mock<IConferenceCache>()
                .Setup(x => x.GetOrAddConferenceAsync(It.IsAny<Guid>(), It.IsAny<Func<Task<ConferenceDetailsResponse>>>()))
                .ThrowsAsync(apiException);
            var request = CreateRequest();

            // Act
            var result = await _sut.SendHearingEventAsync(request);

            // Assert
            result.Should().BeOfType<ObjectResult>();
            var typedResult = (ObjectResult) result;
            typedResult.Should().NotBeNull();
            typedResult.StatusCode.Should().Be(StatusCodes.Status500InternalServerError);
        }

        private ConferenceEventRequest CreateRequest(string phone = null)
        {
            return Builder<ConferenceEventRequest>.CreateNew()
                .With(x => x.Conference_id = _testConference.Id.ToString())
                .With(x => x.Participant_id = _testConference.Participants[0].Id.ToString())
                .With(x => x.Event_type = EventType.Joined)
                .With(x => x.Phone = phone)
                .Build();
        }
        
        private ConferenceEventRequest CreateEndpointRequest(EventType incomingEventType)
        {
            return Builder<ConferenceEventRequest>.CreateNew()
                .With(x => x.Conference_id = _testConference.Id.ToString())
                .With(x => x.Participant_id = _testConference.Endpoints[0].Id.ToString())
                .With(x => x.Event_type = incomingEventType)
                .With(x => x.Transfer_to = RoomType.ConsultationRoom1.ToString())
                .With(x => x.Transfer_from = RoomType.WaitingRoom.ToString())
                .With(x => x.Phone = null)
                .Build();
        }
        
        private static Conference BuildConferenceForTest()
        {
            return new Conference
            {
                Id = Guid.NewGuid(),
                HearingId = Guid.NewGuid(),
                Participants = new List<Participant>()
                {
                    Builder<Participant>.CreateNew()
                        .With(x => x.Role = Role.Judge).With(x => x.Id = Guid.NewGuid())
                        .Build(),
                    Builder<Participant>.CreateNew().With(x => x.Role = Role.Individual)
                        .With(x => x.Id = Guid.NewGuid()).Build(),
                    Builder<Participant>.CreateNew().With(x => x.Role = Role.Representative)
                        .With(x => x.Id = Guid.NewGuid()).Build(),
                    Builder<Participant>.CreateNew().With(x => x.Role = Role.Individual)
                        .With(x => x.Id = Guid.NewGuid()).Build(),
                    Builder<Participant>.CreateNew().With(x => x.Role = Role.Representative)
                        .With(x => x.Id = Guid.NewGuid()).Build()
                },
                Endpoints = new List<Endpoint>
                {
                    Builder<Endpoint>.CreateNew().With(x => x.Id = Guid.NewGuid()).With(x => x.DisplayName = "EP1").Build(),
                    Builder<Endpoint>.CreateNew().With(x => x.Id = Guid.NewGuid()).With(x => x.DisplayName = "EP2").Build()
                }
            };
        }

        private ConferenceDetailsResponse CreateValidConferenceResponse(string username = "john@doe.com")
        {
            var participants = Builder<ParticipantDetailsResponse>.CreateListOfSize(2).Build().ToList();
            if (!string.IsNullOrWhiteSpace(username))
            {
                participants.First().Username = username;
            }

            var conference = Builder<ConferenceDetailsResponse>.CreateNew()
                .With(x => x.Participants = participants)
                .Build();
            return conference;
        }


    }
}
