using System.Net;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using Testing.Common.Helpers;
using VideoWeb.Controllers;
using VideoWeb.Services.User;
using VideoWeb.Services.Video;

namespace VideoWeb.UnitTests.Controllers.SelfTestController
{
    public class GetPexipConfigTests
    {
        private VideoWeb.Controllers.SelfTestController _controller;
        private Mock<IVideoApiClient> _videoApiClientMock;
        private Mock<ILogger<VideoWeb.Controllers.SelfTestController>> _mockLogger;

        [SetUp]
        public void Setup()
        {
            _videoApiClientMock = new Mock<IVideoApiClient>();
            _mockLogger = new Mock<ILogger<VideoWeb.Controllers.SelfTestController>>();
            var claimsPrincipal = new ClaimsPrincipalBuilder().Build();
            var context = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = claimsPrincipal
                }
            };
            _controller = new VideoWeb.Controllers.SelfTestController(_videoApiClientMock.Object, _mockLogger.Object)
            {
                ControllerContext = context
            };
        }

        [Test]
        public void should_return_ok_with_pexipnode()
        {
            var result = _controller.GetPexipConfig();
            var typedResult = (OkObjectResult)result.Result;
            typedResult.Should().NotBeNull();
        }
    }
}
