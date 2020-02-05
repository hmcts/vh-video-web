using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using FizzWare.NBuilder;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using VideoWeb.Controllers;
using VideoWeb.EventHub.Handlers.Core;
using VideoWeb.EventHub.Models;
using VideoWeb.Services.Video;
using VideoWeb.UnitTests.Builders;
using EventComponentHelper = VideoWeb.UnitTests.Builders.EventComponentHelper;
using MemoryCache = Microsoft.Extensions.Caching.Memory.MemoryCache;
using ProblemDetails = VideoWeb.Services.Video.ProblemDetails;
using Role = VideoWeb.EventHub.Enums.UserRole;

namespace VideoWeb.UnitTests.Controllers.VideoEventController
{
    public class SendHearingEventTests
    {
        private VideoEventsController _controller;
        private Mock<IVideoApiClient> _videoApiClientMock;
        private Conference _testConference;
        private Mock<ILogger<VideoEventsController>> _mockLogger;

        [SetUp]
        public void Setup()
        {
            _videoApiClientMock = new Mock<IVideoApiClient>();
            _testConference = BuildConferenceForTest();
            var helper = new EventComponentHelper();
            _mockLogger = new Mock<ILogger<VideoEventsController>>();

            var handlerList = helper.GetHandlers();
            helper.Cache.Set(_testConference.Id, _testConference);
            helper.RegisterUsersForHubContext(_testConference.Participants);
            
            var eventHandlerFactory = new EventHandlerFactory(handlerList);
            
            var claimsPrincipal = new ClaimsPrincipalBuilder().Build();
            var context = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = claimsPrincipal
                }
            };
            
            _controller = new VideoEventsController(_videoApiClientMock.Object, eventHandlerFactory, 
                new MemoryCache(new MemoryCacheOptions()), _mockLogger.Object)
            {
                ControllerContext = context
            };

            var conference = CreateValidConferenceResponse(null);
            _videoApiClientMock
                .Setup(x => x.GetConferenceDetailsByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(conference);

        }

        [Test]
        public async Task Should_return_no_content_when_event_is_sent()
        {
            _videoApiClientMock
                .Setup(x => x.RaiseVideoEventAsync(It.IsAny<ConferenceEventRequest>()))
                .Returns(Task.FromResult(default(object)));
            
            var result = await _controller.SendHearingEvent(CreateRequest());
            var typedResult = (NoContentResult) result;
            typedResult.Should().NotBeNull();
            _videoApiClientMock.Verify(v => v.GetConferenceDetailsByIdAsync(It.IsAny<Guid>()), Times.Once);
        }
        
        [Test]
        public async Task Should_return_bad_request()
        {
            var apiException = new VideoApiException<ProblemDetails>("Bad Request", (int) HttpStatusCode.BadRequest,
                "Please provide a valid conference Id", null, default, null);
            _videoApiClientMock
                .Setup(x => x.RaiseVideoEventAsync(It.IsAny<ConferenceEventRequest>()))
                .ThrowsAsync(apiException);
            
            var result = await _controller.SendHearingEvent(CreateRequest());
            var typedResult = (ObjectResult) result;
            typedResult.StatusCode.Should().Be((int) HttpStatusCode.BadRequest);
        }
        
        [Test]
        public async Task Should_return_exception()
        {
            var apiException = new VideoApiException<ProblemDetails>("Internal Server Error", (int) HttpStatusCode.InternalServerError,
                "Stacktrace goes here", null, default, null);
            _videoApiClientMock
                .Setup(x => x.RaiseVideoEventAsync(It.IsAny<ConferenceEventRequest>()))
                .ThrowsAsync(apiException);

            var result = await _controller.SendHearingEvent(CreateRequest());
            var typedResult = (ObjectResult) result;
            typedResult.Should().NotBeNull();
        }

        private ConferenceEventRequest CreateRequest()
        {
            return Builder<ConferenceEventRequest>.CreateNew()
                .With(x => x.Conference_id = _testConference.Id.ToString())
                .With(x => x.Participant_id = _testConference.Participants[0].Id.ToString())
                .With(x => x.Event_type = EventType.Joined)
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