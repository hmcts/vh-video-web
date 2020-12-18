using System;
using System.Net;
using System.Threading.Tasks;
using Autofac;
using Autofac.Extras.Moq;
using FizzWare.NBuilder;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Moq;
using NUnit.Framework;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoWeb.Controllers;
using VideoWeb.EventHub.Handlers.Core;
using VideoWeb.Services.Video;
using VideoWeb.UnitTests.Builders;
using EventComponentHelper = VideoWeb.UnitTests.Builders.EventComponentHelper;
using ProblemDetails = VideoWeb.Services.Video.ProblemDetails;

namespace VideoWeb.UnitTests.Controllers.ParticipantController
{
    public class GetTestCallResultForParticipantTests
    {
        private AutoMock _mocker;
        private ParticipantsController _controller;
        private EventComponentHelper _eventComponentHelper;
        private Conference _testConference;

        [SetUp]
        public void Setup()
        {
            _mocker = AutoMock.GetLoose();
            var memoryCache = new MemoryCache(new MemoryCacheOptions());
            var conferenceCache = new ConferenceCache(memoryCache);
            _eventComponentHelper = new EventComponentHelper();
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
            _controller = _mocker.Create<ParticipantsController>(new TypedParameter(typeof(IEventHandlerFactory), eventHandlerFactory), new TypedParameter(typeof(IConferenceCache), conferenceCache));
            _controller.ControllerContext = context;
            _eventComponentHelper.Cache.Set(_testConference.Id, _testConference);
            _eventComponentHelper.RegisterUsersForHubContext(_testConference.Participants);
        }

        [Test]
        public async Task Should_return_ok_when_testcall_result_returned()
        {
            var testCallResponse = Builder<TestCallScoreResponse>.CreateNew().Build();
            var conferenceId = Guid.NewGuid();
            var participantId = Guid.NewGuid();
            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.GetTestCallResultForParticipantAsync(conferenceId, participantId))
                .Returns(Task.FromResult(testCallResponse));

            var result = await _controller.GetTestCallResultForParticipantAsync(conferenceId, participantId);
            var typedResult = (OkObjectResult)result;
            typedResult.Should().NotBeNull();
            typedResult.Value.Should().BeEquivalentTo(testCallResponse);
        }

        [Test]
        public async Task Should_forward_error_code_on_failure()
        {
            var apiException = new VideoApiException<ProblemDetails>("Bad Request", (int)HttpStatusCode.BadRequest,
                "Please provide a valid conference Id", null, default, null);
            var conferenceId = Guid.NewGuid();
            var participantId = Guid.NewGuid();
            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.GetTestCallResultForParticipantAsync(conferenceId, participantId))
                .ThrowsAsync(apiException);

            var result = await _controller.GetTestCallResultForParticipantAsync(conferenceId, participantId);
            var typedResult = (ObjectResult)result;
            typedResult.StatusCode.Should().Be((int)HttpStatusCode.BadRequest);
        }

        [Test]
        public async Task Should_return_ok_when_independent_testcall_result_returned()
        {
            var testCallResponse = Builder<TestCallScoreResponse>.CreateNew().Build();
            var participantId = Guid.NewGuid();
            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.GetIndependentTestCallResultAsync(participantId))
                .Returns(Task.FromResult(testCallResponse));

            var result = await _controller.GetIndependentTestCallResultAsync(participantId);
            var typedResult = (OkObjectResult)result;
            typedResult.Should().NotBeNull();
            typedResult.Value.Should().BeEquivalentTo(testCallResponse);
        }

        [Test]
        public async Task Should_forward_error_code_on_failure_when_independent_testcall()
        {
            var apiException = new VideoApiException<Microsoft.AspNetCore.Mvc.ProblemDetails>("Bad Request", (int)HttpStatusCode.BadRequest,
                "Please provide a valid participant Id", null, default, null);
            var participantId = Guid.NewGuid();
            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.GetIndependentTestCallResultAsync(participantId))
                .ThrowsAsync(apiException);

            var result = await _controller.GetIndependentTestCallResultAsync(participantId);
            var typedResult = (ObjectResult)result;
            typedResult.StatusCode.Should().Be((int)HttpStatusCode.BadRequest);
        }
    }
}
