using System;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using FizzWare.NBuilder;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using Testing.Common.Helpers;
using VideoWeb.Services.Video;
using ProblemDetails = VideoWeb.Services.Video.ProblemDetails;

namespace VideoWeb.UnitTests.Controllers.TasksController
{
    public class GetTasksTests
    {
        private VideoWeb.Controllers.TasksController _controller;
        private Mock<ILogger<VideoWeb.Controllers.TasksController>> _mockLogger;
        private Mock<IVideoApiClient> _videoApiClientMock;

        [SetUp]
        public void Setup()
        {
            _videoApiClientMock = new Mock<IVideoApiClient>();
            _mockLogger = new Mock<ILogger<VideoWeb.Controllers.TasksController>>();
            var claimsPrincipal = new ClaimsPrincipalBuilder().Build();
            var context = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = claimsPrincipal
                }
            };

            _controller = new VideoWeb.Controllers.TasksController(_videoApiClientMock.Object, _mockLogger.Object)
            {
                ControllerContext = context
            };
        }

        [Test]
        public async Task should_return_ok_when_get_tasks_is_called()
        {
            var tasks = Builder<TaskResponse>.CreateListOfSize(4).Build().ToList();
            
            _videoApiClientMock
                .Setup(x => x.GetTasksForConferenceAsync(It.IsAny<Guid>()))
                .ReturnsAsync(tasks);

            var result = await _controller.GetTasks(Guid.NewGuid());
            var typedResult = (OkObjectResult)result;
            typedResult.Should().NotBeNull();
        }

        [Test]
        public async Task should_return_exception()
        {
            var apiException = new VideoApiException<ProblemDetails>("Internal Server Error", (int)HttpStatusCode.InternalServerError,
                "Stacktrace goes here", null, default(ProblemDetails), null);
            _videoApiClientMock
                .Setup(x => x.GetTasksForConferenceAsync(It.IsAny<Guid>()))
                .ThrowsAsync(apiException);

            var result = await _controller.GetTasks(Guid.NewGuid());
            var typedResult = (ObjectResult)result;
            typedResult.Should().NotBeNull();
        }

    }
}