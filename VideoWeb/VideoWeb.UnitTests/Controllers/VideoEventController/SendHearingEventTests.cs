using System;
using System.Net;
using System.Threading.Tasks;
using FizzWare.NBuilder;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using VideoWeb.Common.Caching;
using VideoWeb.EventHub.Handlers.Core;
using VideoWeb.EventHub.Models;
using VideoApi.Client;
using VideoApi.Contract.Responses;
using VideoApi.Contract.Requests;
using VideoApi.Contract.Enums;
using RoomType = VideoApi.Contract.Enums.RoomType;

namespace VideoWeb.UnitTests.Controllers.VideoEventController
{
    public class SendHearingEventTests : BaseSendHearingEventTests
    {
        [SetUp]
        public void Setup()
        {
            SetupTestConferenceAndMocks();
        }

        [Test]
        public async Task Should_return_no_content_when_event_is_sent()
        {
            // Arrange
            var request = CreateRequest();

            // Act
            var result = await Sut.SendHearingEventAsync(request);

            // Assert
            Mocker.Mock<IEventHandler>().Verify(x => x.HandleAsync(It.IsAny<CallbackEvent>()), Times.Once);
            result.Should().BeOfType<NoContentResult>();
            var typedResult = (NoContentResult) result;
            typedResult.Should().NotBeNull();
        }

        [Test]
        public async Task should_return_no_content_when_transfer_to_new_consultation_room()
        {
            // Arrange
            var request = CreateRequest();
            request.EventType = EventType.Transfer;
            request.TransferTo = "JudgeConsultationRoom3";
            request.TransferFrom = RoomType.WaitingRoom.ToString();

            // Act
            var result = await Sut.SendHearingEventAsync(request);

            // Assert
            Mocker.Mock<IEventHandler>().Verify(x => x.HandleAsync(It.IsAny<CallbackEvent>()), Times.Once);
            result.Should().BeOfType<NoContentResult>();
            var typedResult = (NoContentResult) result;
            typedResult.Should().NotBeNull();
        }
        
        [Test]
        public async Task should_return_no_content_when_transfer_from_new_consultation_room()
        {
            // Arrange
            var request = CreateRequest();
            request.EventType = EventType.Transfer;
            request.TransferFrom = "JudgeConsultationRoom3";
            request.TransferTo = RoomType.WaitingRoom.ToString();

            // Act
            var result = await Sut.SendHearingEventAsync(request);

            // Assert
            Mocker.Mock<IEventHandler>().Verify(x => x.HandleAsync(It.IsAny<CallbackEvent>()), Times.Once);
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
            var result = await Sut.SendHearingEventAsync(request);

            // Assert
            Mocker.Mock<IEventHandler>().Verify(x => x.HandleAsync(It.IsAny<CallbackEvent>()), Times.Never);
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
            var eventType = Enum.Parse<EventHub.Enums.EventType>(expectedEventType.ToString());

            // Act
            var result = await Sut.SendHearingEventAsync(request);
            
            // Assert
            result.Should().BeOfType<NoContentResult>();
            var typedResult = (NoContentResult) result;
            typedResult.Should().NotBeNull();
            Mocker.Mock<IEventHandler>().Verify(x => x.HandleAsync(It.Is<CallbackEvent>(c => c.EventType == eventType)), Times.Once);
            Mocker.Mock<IVideoApiClient>().Verify(x =>
                x.RaiseVideoEventAsync(It.Is<ConferenceEventRequest>(r => r.EventType == expectedEventType)));
        }

        [TestCase(EventType.Joined)]
        [TestCase(EventType.Disconnected)]
        [TestCase(EventType.Transfer)]
        public async Task Should_return_no_content_with_no_matching_participant(EventType incomingEventType)
        {
            // Arrange
            var request = CreateEndpointRequest(incomingEventType);
            request.ParticipantId = Guid.NewGuid().ToString();
            var eventType = Enum.Parse<EventHub.Enums.EventType>(incomingEventType.ToString());

            // Act
            var result = await Sut.SendHearingEventAsync(request);

            // Assert
            result.Should().BeOfType<NoContentResult>();
            var typedResult = (NoContentResult)result;
            typedResult.Should().NotBeNull();
            Mocker.Mock<IEventHandler>().Verify(x => x.HandleAsync(It.Is<CallbackEvent>(c => c.EventType == eventType)), Times.Once);
            Mocker.Mock<IVideoApiClient>().Verify(x =>
                x.RaiseVideoEventAsync(It.Is<ConferenceEventRequest>(r => r.EventType == incomingEventType)));
        }

        [Test]
        public async Task Should_return_bad_request()
        { 
            // Arrange
            var apiException = new VideoApiException<ProblemDetails>("Bad Request", (int) HttpStatusCode.BadRequest,
                "Please provide a valid conference Id", null, default, null);
            Mocker.Mock<IVideoApiClient>()
                .Setup(x => x.RaiseVideoEventAsync(It.IsAny<ConferenceEventRequest>()))
                .ThrowsAsync(apiException);
            var request = CreateRequest();

            // Act
            var result = await Sut.SendHearingEventAsync(request);

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
            Mocker.Mock<IVideoApiClient>()
                .Setup(x => x.RaiseVideoEventAsync(It.IsAny<ConferenceEventRequest>()))
                .ThrowsAsync(apiException);
            var request = CreateRequest();

            // Act
            var result = await Sut.SendHearingEventAsync(request);

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
            Mocker.Mock<IConferenceCache>()
                .Setup(x => x.GetOrAddConferenceAsync(It.IsAny<Guid>(), It.IsAny<Func<Task<ConferenceDetailsResponse>>>()))
                .ThrowsAsync(apiException);
            var request = CreateRequest();

            // Act
            var result = await Sut.SendHearingEventAsync(request);

            // Assert
            result.Should().BeOfType<ObjectResult>();
            var typedResult = (ObjectResult) result;
            typedResult.Should().NotBeNull();
            typedResult.StatusCode.Should().Be(StatusCodes.Status500InternalServerError);
        }
        
        private ConferenceEventRequest CreateEndpointRequest(EventType incomingEventType)
        {
            return Builder<ConferenceEventRequest>.CreateNew()
                .With(x => x.ConferenceId = TestConference.Id.ToString())
                .With(x => x.ParticipantId = TestConference.Endpoints[0].Id.ToString())
                .With(x => x.EventType = incomingEventType)
                .With(x => x.TransferTo = "ParticipantConsultationRoom10")
                .With(x => x.TransferFrom = RoomType.WaitingRoom.ToString())
                .With(x => x.ParticipantRoomId = null)
                .With(x => x.Phone = null)
                .Build();
        }
        
    }
}
