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
using VideoWeb.Contract.Responses;
using VideoWeb.EventHub.Models;
using VideoApi.Contract.Enums;
using VideoWeb.Common;

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

            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<Conference, IEnumerable<ParticipantInHearingResponse>, IEnumerable<ParticipantContactDetailsResponseVho>>()).Returns(_mocker.Create<ParticipantStatusResponseForVhoMapper>());
            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<EventType, string>()).Returns(_mocker.Create<EventTypeReasonMapper>());
            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<ConferenceEventRequest, Conference, CallbackEvent>()).Returns(_mocker.Create<CallbackEventMapper>());
            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<IEnumerable<ParticipantSummaryResponse>, List<ParticipantForUserResponse>>()).Returns(_mocker.Create<ParticipantForUserResponseMapper>());

            _sut = _mocker.Create<ParticipantsController>();
            _sut.ControllerContext = context;
            _mocker.Mock<IConferenceService>().Setup(x => x.GetConference(_testConference.Id)).ReturnsAsync(_testConference);
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
            
            var result = await _sut.UpdateParticipantStatusAsync(conferenceId, request);
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
            
            await _sut.UpdateParticipantStatusAsync(conferenceId, request);
            _mocker.Mock<IConferenceService>().Verify(x => x.GetConference(_testConference.Id), Times.Once);
        }

        [Test]
        public async Task Should_throw_error_when_get_api_throws_error()
        {
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
