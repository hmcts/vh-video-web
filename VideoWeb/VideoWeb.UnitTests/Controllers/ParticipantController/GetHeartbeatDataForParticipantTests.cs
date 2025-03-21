using System;
using System.Collections.Generic;
using System.Net;
using System.Threading;
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
        private Conference _testConference;
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
            _testConference = EventComponentHelper.BuildConferenceForTest();            

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

            _eventComponentHelper.Cache.Set(_testConference.Id, _testConference);
            _eventComponentHelper.RegisterUsersForHubContext(_testConference.Participants);
        }
        
        [Test]
        public async Task Should_get_heartbeat_data_for_participant()
        {
            var responses = Builder<List<ParticipantHeartbeatResponse>>.CreateNew().Build();
            var conferenceId = Guid.NewGuid();
            var participantId = Guid.NewGuid();
            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.GetHeartbeatDataForParticipantAsync(conferenceId, participantId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(responses);

            var result = await _sut.GetHeartbeatDataForParticipantAsync(conferenceId, participantId, CancellationToken.None);
            var typedResult = (OkObjectResult)result;
            typedResult.Should().NotBeNull();
            typedResult.Value.Should().BeEquivalentTo(responses);
        }
    }
}
