using System;
using System.Net;
using System.Threading.Tasks;
using FizzWare.NBuilder;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using Testing.Common.Helpers;
using VideoWeb.Contract.Request;
using VideoWeb.Controllers;
using VideoWeb.Services;
using VideoWeb.Services.Video;

namespace VideoWeb.UnitTests.Controllers.ParticipantController
{
    public class GetTestCallResultForParticipantTests
    {
        private ParticipantsController _controller;
        private Mock<IVideoApiClient> _videoApiClientMock;
        private Mock<IEventsServiceClient> _eventsServiceClientMock;
        
        [SetUp]
        public void Setup()
        {
            _videoApiClientMock = new Mock<IVideoApiClient>();
            _eventsServiceClientMock = new Mock<IEventsServiceClient>();
            var claimsPrincipal = new ClaimsPrincipalBuilder().Build();
            var context = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = claimsPrincipal
                }
            };

            _controller = new ParticipantsController(_videoApiClientMock.Object, _eventsServiceClientMock.Object)
            {
                ControllerContext = context
            };
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
            var apiException = new VideoApiException<Microsoft.AspNetCore.Mvc.ProblemDetails>("Bad Request", (int)HttpStatusCode.BadRequest,
                "Please provide a valid conference Id", null, default(Microsoft.AspNetCore.Mvc.ProblemDetails), null);
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
            _eventsServiceClientMock
                .Setup(x => x.PostEventsAsync(It.IsAny<ConferenceEventRequest>()))
                .Returns(Task.FromResult(default(object)));

            var result = await _controller.UpdateParticipantStatus(Guid.NewGuid(), 
                Builder<UpdateParticipantStatusEventRequest>.CreateNew().Build());
            var typedResult = (NoContentResult)result;
            typedResult.Should().NotBeNull();
        }

        [Test]
        public async Task should_return_bad_request()
        {
            var apiException = new VideoApiException<Microsoft.AspNetCore.Mvc.ProblemDetails>("Bad Request", 
                (int)HttpStatusCode.BadRequest, "Please provide a valid conference Id", null, 
                default(Microsoft.AspNetCore.Mvc.ProblemDetails), null);
            _eventsServiceClientMock
                .Setup(x => x.PostEventsAsync(It.IsAny<ConferenceEventRequest>()))
                .ThrowsAsync(apiException);

            var result = await _controller.UpdateParticipantStatus(Guid.NewGuid(), 
                Builder<UpdateParticipantStatusEventRequest>.CreateNew().Build());
            var typedResult = (ObjectResult)result;
            typedResult.StatusCode.Should().Be((int)HttpStatusCode.BadRequest);
        }

        [Test]
        public async Task should_return_exception()
        {
            var apiException = new VideoApiException<Microsoft.AspNetCore.Mvc.ProblemDetails>("Internal Server Error", 
                (int)HttpStatusCode.InternalServerError, "Stacktrace goes here", null, 
                default(Microsoft.AspNetCore.Mvc.ProblemDetails), null);
            _eventsServiceClientMock
                .Setup(x => x.PostEventsAsync(It.IsAny<ConferenceEventRequest>()))
                .ThrowsAsync(apiException);

            var result = await _controller.UpdateParticipantStatus(Guid.NewGuid(), 
                Builder<UpdateParticipantStatusEventRequest>.CreateNew().Build());
            var typedResult = (ObjectResult)result;
            typedResult.Should().NotBeNull();
        }
    }
}