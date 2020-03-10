using System;
using System.Collections.Generic;
using System.Net;
using System.Threading.Tasks;
using FizzWare.NBuilder;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Moq;
using NUnit.Framework;
using VideoWeb.Controllers;
using VideoWeb.EventHub.Handlers.Core;
using VideoWeb.EventHub.Models;
using VideoWeb.Services.Video;
using VideoWeb.UnitTests.Builders;
using ProblemDetails = VideoWeb.Services.Video.ProblemDetails;

namespace VideoWeb.UnitTests.Controllers.ParticipantController
{
    public class GetHeartbeatDataForParticipantTests
    {
        private ParticipantsController _controller;
        private Mock<IVideoApiClient> _videoApiClientMock;
        private EventComponentHelper _eventComponentHelper;
        private Conference _testConference;
        
        [SetUp]
        public void Setup()
        {
            _eventComponentHelper = new EventComponentHelper();
            _videoApiClientMock = new Mock<IVideoApiClient>();
            var claimsPrincipal = new ClaimsPrincipalBuilder().Build();
            _testConference = _eventComponentHelper.BuildConferenceForTest();

            var context = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = claimsPrincipal
                }
            };

            var eventHandlerFactory = new EventHandlerFactory(_eventComponentHelper.GetHandlers());
            _controller = new ParticipantsController(_videoApiClientMock.Object, eventHandlerFactory)
            {
                ControllerContext = context
            };
            _eventComponentHelper.Cache.Set(_testConference.Id, _testConference);
            _eventComponentHelper.RegisterUsersForHubContext(_testConference.Participants);
        }
        
        [Test]
        public async Task Should_get_heartbeat_data_for_participant()
        {
            var responses = Builder<List<ParticipantHeartbeatResponse>>.CreateNew().Build();
            var conferenceId = Guid.NewGuid();
            var participantId = Guid.NewGuid();
            _videoApiClientMock
                .Setup(x => x.GetHeartbeatDataForParticipantAsync(conferenceId, participantId))
                .Returns(Task.FromResult(responses));

            var result = await _controller.GetHeartbeatDataForParticipantAsync(conferenceId, participantId);
            var typedResult = (OkObjectResult)result;
            typedResult.Should().NotBeNull();
            typedResult.Value.Should().BeEquivalentTo(responses);
        }
        
        [Test]
        public async Task Should_throw_error_when_get_heartbeat_data_for_participant()
        {
            var apiException = new VideoApiException<ProblemDetails>("Bad Request", (int)HttpStatusCode.BadRequest,
                "Please provide a valid participant Id", null, default, null);
            var conferenceId = Guid.NewGuid();
            var participantId = Guid.NewGuid();
            _videoApiClientMock
                .Setup(x => x.GetHeartbeatDataForParticipantAsync(conferenceId, participantId))
                .Throws(apiException);

            var result = await _controller.GetHeartbeatDataForParticipantAsync(conferenceId, participantId);
            var typedResult = (ObjectResult)result;
            typedResult.StatusCode.Should().Be((int)HttpStatusCode.BadRequest);
        }
    }
}
