using System;
using System.Net;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Request;
using VideoWeb.Controllers;
using VideoWeb.EventHub.Handlers.Core;
using VideoWeb.Services.Video;
using VideoWeb.UnitTests.Builders;
using ProblemDetails = VideoWeb.Services.Video.ProblemDetails;
using EventHubEventType = VideoWeb.EventHub.Enums.EventType;
using Autofac.Extras.Moq;
using VideoWeb.Mappings;

namespace VideoWeb.UnitTests.Controllers.ParticipantController
{
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
            _testConference = eventComponentHelper.BuildConferenceForTest();
            _testConference.Participants[0].Username = ClaimsPrincipalBuilder.Username;

            var context = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = claimsPrincipal
                }
            };

            var parameters = new ParameterBuilder(_mocker)
                .AddTypedParameters<ParticipantStatusResponseForVhoMapper>()
                .AddTypedParameters<EventTypeReasonMapper>()
                .AddTypedParameters<CallbackEventMapper>()
                .AddTypedParameters<ParticipantForUserResponseMapper>()
                .Build();
            _sut = _mocker.Create<ParticipantsController>(parameters);
            _sut.ControllerContext = context;
        }

        [Test]
        public async Task Should_return_ok()
        {
            _mocker.Mock<IConferenceCache>().Setup(cache => cache.GetOrAddConferenceAsync(_testConference.Id, It.IsAny<Func<Task<ConferenceDetailsResponse>>>()))
                .Callback(async (Guid anyGuid, Func<Task<ConferenceDetailsResponse>> factory) => await factory())
                .ReturnsAsync(_testConference);
            
            var conferenceId = _testConference.Id;
            var request = new UpdateParticipantStatusEventRequest
            {
                EventType = EventType.Joined
            };
            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.RaiseVideoEventAsync(It.IsAny<ConferenceEventRequest>()))
                .Returns(Task.FromResult(default(object)));
            
            var result = await _sut.UpdateParticipantStatusAsync(conferenceId, request);
            var typedResult = (NoContentResult) result;
            typedResult.Should().NotBeNull();
        }
        
        [Test]
        public async Task Should_call_api_when_cache_is_empty()
        {
            _mocker.Mock<IConferenceCache>().Setup(cache => cache.GetOrAddConferenceAsync(_testConference.Id, It.IsAny<Func<Task<ConferenceDetailsResponse>>>()))
                .Callback(async (Guid anyGuid, Func<Task<ConferenceDetailsResponse>> factory) => await factory())
                .ReturnsAsync(_testConference);
            
            var conferenceId = _testConference.Id;
            var request = new UpdateParticipantStatusEventRequest
            {
                EventType = EventType.Joined
            };
            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.RaiseVideoEventAsync(It.IsAny<ConferenceEventRequest>()))
                .Returns(Task.FromResult(default(object)));
            
            await _sut.UpdateParticipantStatusAsync(conferenceId, request);
            _mocker.Mock<IVideoApiClient>().Verify(x => x.GetConferenceDetailsByIdAsync(_testConference.Id), Times.Once);
        }

        [Test]
        public async Task Should_throw_error_when_get_api_throws_error()
        {
            _mocker.Mock<IConferenceCache>().Setup(cache => cache.GetOrAddConferenceAsync(_testConference.Id, It.IsAny<Func<Task<ConferenceDetailsResponse>>>()))
                .Callback(async (Guid anyGuid, Func<Task<ConferenceDetailsResponse>> factory) => await factory())
                .ReturnsAsync(_testConference);
            
            var conferenceId = _testConference.Id;
            var request = new UpdateParticipantStatusEventRequest
            {
                EventType = EventType.Joined
            };
            var apiException = new VideoApiException<ProblemDetails>("Bad Request", (int) HttpStatusCode.BadRequest,
                "Please provide a valid conference Id", null, default, null);
            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.RaiseVideoEventAsync(It.IsAny<ConferenceEventRequest>()))
                .ThrowsAsync(apiException);

            var result = await _sut.UpdateParticipantStatusAsync(conferenceId, request);
            var typedResult = (ObjectResult)result;
            typedResult.StatusCode.Should().Be((int)HttpStatusCode.BadRequest);
        }
    }
}
