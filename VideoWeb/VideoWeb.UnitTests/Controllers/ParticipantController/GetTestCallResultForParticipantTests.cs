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
using VideoWeb.Controllers;
using VideoWeb.Services.Video;

namespace VideoWeb.UnitTests.Controllers.ParticipantController
{
    public class GetTestCallResultForParticipantTests
    {
        private ParticipantsController _controller;
        private Mock<IVideoApiClient> _videoApiClientMock;
        
        [SetUp]
        public void Setup()
        {
            _videoApiClientMock = new Mock<IVideoApiClient>();
            var claimsPrincipal = new ClaimsPrincipalBuilder().Build();
            var context = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = claimsPrincipal
                }
            };

            _controller = new ParticipantsController(_videoApiClientMock.Object)
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
    }
}