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
using VideoWeb.Services;
using VideoWeb.Services.Video;
using ProblemDetails = VideoWeb.Services.Video.ProblemDetails;

namespace VideoWeb.UnitTests.Controllers.MediaEventController
{
    public class AddSelfTestFailureEventToConferenceTests
    {
        private VideoWeb.Controllers.MediaEventController _controller;
        private Mock<IEventsServiceClient> _eventsServiceClientMock;
        
        [SetUp]
        public void Setup()
        {
            _eventsServiceClientMock = new Mock<IEventsServiceClient>();
            var claimsPrincipal = new ClaimsPrincipalBuilder().Build();
            var context = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = claimsPrincipal
                }
            };

            _controller = new VideoWeb.Controllers.MediaEventController(_eventsServiceClientMock.Object)
            {
                ControllerContext = context
            };
        }

        [Test]
        public async Task should_return_no_content_when_event_is_sent()
        {
            _eventsServiceClientMock
                .Setup(x => x.PostEventsAsync(It.IsAny<ConferenceEventRequest>()))
                .Returns(Task.FromResult(default(object)));

            var conferenceId = Guid.NewGuid();
            var request = new AddSelfTestFailureEventRequest
            {
                ParticipantId = Guid.NewGuid(),
                SelfTestFailureReason = SelfTestFailureReason.BadScore
            };
            var result = await _controller.AddSelfTestFailureEventToConference(conferenceId, request);
            var typedResult = (NoContentResult) result;
            typedResult.Should().NotBeNull();
        }

        [Test]
        public async Task should_return_status_code_with_message_when_not_successful()
        {
            var apiException = new VideoApiException<ProblemDetails>("Internal Server Error",
                (int) HttpStatusCode.InternalServerError,
                "Stacktrace goes here", null, default(ProblemDetails), null);
            _eventsServiceClientMock
                .Setup(x => x.PostEventsAsync(It.IsAny<ConferenceEventRequest>()))
                .ThrowsAsync(apiException);

            var conferenceId = Guid.NewGuid();
            var request = new AddSelfTestFailureEventRequest
            {
                ParticipantId = Guid.NewGuid(),
                SelfTestFailureReason = SelfTestFailureReason.BadScore
            };
            var result = await _controller.AddSelfTestFailureEventToConference(conferenceId, request);
            var typedResult = (ObjectResult) result;
            typedResult.Should().NotBeNull();
        }
    }
}