using System;
using System.Collections.Generic;
using System.Net;
using System.Threading.Tasks;
using Autofac;
using Autofac.Extras.Moq;
using FizzWare.NBuilder;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using NUnit.Framework;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoWeb.Controllers;
using VideoWeb.EventHub.Handlers.Core;
using VideoApi.Client;
using VideoApi.Contract.Responses;
using VideoWeb.UnitTests.Builders;
using Moq;

namespace VideoWeb.UnitTests.Controllers.ParticipantController
{
    public class GetHeartbeatDataForParticipantTests
    {
        private AutoMock _mocker;
        private ParticipantsController _sut;
        private EventComponentHelper _eventComponentHelper;
        private ConferenceDto _testConferenceDto;
        private MemoryCache _memoryCache;
        private IConferenceCache _conferenceCache;
        
        [SetUp]
        public void Setup()
        {
            _mocker = AutoMock.GetLoose();
            _memoryCache = new MemoryCache(new MemoryCacheOptions());
            _conferenceCache = new ConferenceCache(_memoryCache);
            _eventComponentHelper = new EventComponentHelper();
            var claimsPrincipal = new ClaimsPrincipalBuilder().Build();
            _testConferenceDto = _eventComponentHelper.BuildConferenceForTest();            

            var context = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = claimsPrincipal
                }
            };

            var eventHandlerFactory = new EventHandlerFactory(_eventComponentHelper.GetHandlers());
            _sut = _mocker.Create<ParticipantsController>(new TypedParameter(typeof(IEventHandlerFactory), eventHandlerFactory), new TypedParameter(typeof(IConferenceCache), _conferenceCache));
            _sut.ControllerContext = context;

            _eventComponentHelper.Cache.Set(_testConferenceDto.Id, _testConferenceDto);
            _eventComponentHelper.RegisterUsersForHubContext(_testConferenceDto.Participants);
        }
        
        [Test]
        public async Task Should_get_heartbeat_data_for_participant()
        {
            var responses = Builder<List<ParticipantHeartbeatResponse>>.CreateNew().Build();
            var conferenceId = Guid.NewGuid();
            var participantId = Guid.NewGuid();
            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.GetHeartbeatDataForParticipantAsync(conferenceId, participantId))
                .ReturnsAsync(responses);

            var result = await _sut.GetHeartbeatDataForParticipantAsync(conferenceId, participantId);
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
            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.GetHeartbeatDataForParticipantAsync(conferenceId, participantId))
                .Throws(apiException);

            var result = await _sut.GetHeartbeatDataForParticipantAsync(conferenceId, participantId);
            var typedResult = (ObjectResult)result;
            typedResult.StatusCode.Should().Be((int)HttpStatusCode.BadRequest);
        }
    }
}
