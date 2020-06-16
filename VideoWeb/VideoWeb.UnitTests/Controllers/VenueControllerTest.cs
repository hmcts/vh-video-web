using System.Net;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using VideoWeb.Controllers;
using VideoWeb.Services.Video;

namespace VideoWeb.UnitTests.Controllers
{
    public class VenueControllerTest
    {
        private VenuesController _controller;
        private Mock<IVideoApiClient> _videoApiClientMock;
        private Mock<ILogger<VenuesController>> _mockLogger;

        [SetUp]
        public void Setup()
        {
            _videoApiClientMock = new Mock<IVideoApiClient>();
            _mockLogger = new Mock<ILogger<VenuesController>>();
            _controller = new VenuesController(_videoApiClientMock.Object, _mockLogger.Object);
        }

        [Test]
        public async Task Should_return_list_of_judges_with_hearings_with_status_ok()
        {
            var judges = new JudgeNameListResponse();

            _videoApiClientMock.Setup(x => x.GetDistinctJudgeNamesAsync()).ReturnsAsync(judges);
            var result = await _controller.GetDistinctJudgeNamesAsync();
            var typedResult = (OkObjectResult)result.Result;
            typedResult.Should().NotBeNull();
            var judgeList = typedResult.Value;
            judgeList.Should().NotBeNull();
        }

        [Test]
        public async Task Should_return_error_when_unable_to_retrieve_venues()
        {
            var apiException = new VideoApiException("Judges not found", (int)HttpStatusCode.NotFound,
                "Error", null, null);
            _videoApiClientMock
                .Setup(x => x.GetDistinctJudgeNamesAsync())
                .ThrowsAsync(apiException);

            var result = await _controller.GetDistinctJudgeNamesAsync();
            var typedResult = (NotFoundResult)result.Result;
            typedResult.Should().NotBeNull();
            typedResult.StatusCode.Should().Be(apiException.StatusCode);
        }
    }
}
