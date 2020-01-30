using System;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using FizzWare.NBuilder;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Moq;
using NUnit.Framework;
using Testing.Common.Helpers;
using VideoWeb.Contract.Request;
using VideoWeb.Controllers;
using VideoWeb.EventHub.Handlers.Core;
using VideoWeb.EventHub.Models;
using VideoWeb.Services.Video;
using ProblemDetails = VideoWeb.Services.Video.ProblemDetails;

namespace VideoWeb.UnitTests.Controllers.ParticipantController
{
    public class GetTestCallResultForParticipantTests
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
        public async Task should_return_ok_when_testcall_result_returned()
        {
            var testCallResponse = Builder<TestCallScoreResponse>.CreateNew().Build();
            var conferenceId = Guid.NewGuid();
            var participantId = Guid.NewGuid();
            _videoApiClientMock
                .Setup(x => x.GetTestCallResultForParticipantAsync(conferenceId, participantId))
                .Returns(Task.FromResult(testCallResponse));

            var result = await _controller.GetTestCallResultForParticipant(conferenceId, participantId);
            var typedResult = (OkObjectResult) result;
            typedResult.Should().NotBeNull();
            typedResult.Value.Should().BeEquivalentTo(testCallResponse);
        }

        [Test]
        public async Task should_forward_error_code_on_failure()
        {
            var apiException = new VideoApiException<ProblemDetails>("Bad Request", (int)HttpStatusCode.BadRequest,
                "Please provide a valid conference Id", null, default(ProblemDetails), null);
            var conferenceId = Guid.NewGuid();
            var participantId = Guid.NewGuid();
            _videoApiClientMock
                .Setup(x => x.GetTestCallResultForParticipantAsync(conferenceId, participantId))
                .ThrowsAsync(apiException);
            
            var result = await _controller.GetTestCallResultForParticipant(conferenceId, participantId);
            var typedResult = (ObjectResult)result;
            typedResult.StatusCode.Should().Be((int)HttpStatusCode.BadRequest);
        }

        [Test]
        public async Task should_return_no_content_when_event_is_sent()
        {
            _videoApiClientMock
                .Setup(x => x.RaiseVideoEventAsync(It.IsAny<ConferenceEventRequest>()))
                .Returns(Task.FromResult(default(object)));

            var result = await _controller.UpdateParticipantStatus(_testConference.Id, 
                Builder<UpdateParticipantStatusEventRequest>.CreateNew().With(x => x.ParticipantId = _testConference.Participants.First().Id).Build());
            var typedResult = (NoContentResult)result;
            typedResult.Should().NotBeNull();
            _videoApiClientMock.Verify(v => 
                v.RaiseVideoEventAsync(It.Is<ConferenceEventRequest>(c => c.Reason== "participant joining")), Times.Once);
        }

        [Test]
        public async Task should_return_bad_request()
        {
            var apiException = new VideoApiException<ProblemDetails>("Bad Request", 
                (int)HttpStatusCode.BadRequest, "Please provide a valid conference Id", null, 
                default(ProblemDetails), null);
            _videoApiClientMock
                .Setup(x => x.RaiseVideoEventAsync(It.IsAny<ConferenceEventRequest>()))
                .ThrowsAsync(apiException);

            var result = await _controller.UpdateParticipantStatus(Guid.NewGuid(), 
                Builder<UpdateParticipantStatusEventRequest>.CreateNew().Build());
            var typedResult = (BadRequestResult)result;
            typedResult.StatusCode.Should().Be((int)HttpStatusCode.BadRequest);
        }

        [Test]
        public async Task should_return_exception()
        {
            var apiException = new VideoApiException<ProblemDetails>("Internal Server Error", 
                (int)HttpStatusCode.InternalServerError, "Stacktrace goes here", null, 
                default(ProblemDetails), null);
            _videoApiClientMock
                .Setup(x => x.RaiseVideoEventAsync(It.IsAny<ConferenceEventRequest>()))
                .ThrowsAsync(apiException);

            var result = await _controller.UpdateParticipantStatus(_testConference.Id,
                Builder<UpdateParticipantStatusEventRequest>.CreateNew().With(x => x.ParticipantId = _testConference.Participants.First().Id).Build());
            var typedResult = (ObjectResult)result;
            typedResult.Should().NotBeNull();
        }

        [Test]
        public async Task should_return_ok_when_independent_testcall_result_returned()
        {
            var testCallResponse = Builder<TestCallScoreResponse>.CreateNew().Build();
            var participantId = Guid.NewGuid();
            _videoApiClientMock
                .Setup(x => x.GetIndependentTestCallResultAsync(participantId))
                .Returns(Task.FromResult(testCallResponse));

            var result = await _controller.GetIndependentTestCallResult(participantId);
            var typedResult = (OkObjectResult)result;
            typedResult.Should().NotBeNull();
            typedResult.Value.Should().BeEquivalentTo(testCallResponse);
        }

        [Test]
        public async Task should_forward_error_code_on_failure_when_independent_testcall()
        {
            var apiException = new VideoApiException<Microsoft.AspNetCore.Mvc.ProblemDetails>("Bad Request", (int)HttpStatusCode.BadRequest,
                "Please provide a valid participant Id", null, default(Microsoft.AspNetCore.Mvc.ProblemDetails), null);
            var participantId = Guid.NewGuid();
            _videoApiClientMock
                .Setup(x => x.GetIndependentTestCallResultAsync(participantId))
                .ThrowsAsync(apiException);

            var result = await _controller.GetIndependentTestCallResult(participantId);
            var typedResult = (ObjectResult)result;
            typedResult.StatusCode.Should().Be((int)HttpStatusCode.BadRequest);
        }

    }
}