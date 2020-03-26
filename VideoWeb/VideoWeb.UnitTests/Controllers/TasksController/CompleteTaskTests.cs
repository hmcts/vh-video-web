using System;
using System.Net;
using System.Threading.Tasks;
using FizzWare.NBuilder;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using VideoWeb.Services.Video;
using VideoWeb.UnitTests.Builders;
using ProblemDetails = VideoWeb.Services.Video.ProblemDetails;

namespace VideoWeb.UnitTests.Controllers.TasksController
{
    public class CompleteTaskTests
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
        public async Task Should_return_ok_with_completed_task()
        {
            var task = Builder<TaskResponse>.CreateNew().Build();
            
            _videoApiClientMock
                .Setup(x => x.UpdateTaskStatusAsync(It.IsAny<Guid>(), It.IsAny<int>(), It.IsAny<UpdateTaskRequest>()))
                .ReturnsAsync(task);

            var result = await _controller.CompleteTaskAsync(Guid.NewGuid(), 1);
            var typedResult = (OkObjectResult) result;
            typedResult.Should().NotBeNull();
        }

        [Test]
        public async Task Should_return_exception()
        {
            var apiException = new VideoApiException<ProblemDetails>("Internal Server Error",
                (int) HttpStatusCode.InternalServerError,
                "Stacktrace goes here", null, default, null);
            _videoApiClientMock
                .Setup(x => x.UpdateTaskStatusAsync(It.IsAny<Guid>(), It.IsAny<int>(), It.IsAny<UpdateTaskRequest>()))
                .ThrowsAsync(apiException);

            var result = await _controller.CompleteTaskAsync(Guid.NewGuid(), 1);
            var typedResult = (ObjectResult) result;
            typedResult.Should().NotBeNull();
        }
    }
}