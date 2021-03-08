using System;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using FizzWare.NBuilder;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using VideoWeb.Controllers;
using BookingsApi.Client;
using BookingsApi.Contract.Requests;
using UserApi.Client;
using UserApi.Contract.Responses;
using VideoApi.Client;
using HealthCheckResponse = VideoWeb.Contract.Responses.HealthCheckResponse;

namespace VideoWeb.UnitTests.Controllers.HealthController
{
    public class HealthTests
    {
        private HealthCheckController _controller;
        private Mock<IVideoApiClient> _videoApiClientMock;
        private Mock<IUserApiClient> _userApiClientMock;
        private Mock<IBookingsApiClient> _bookingsApiClientMock;
        private Mock<ILogger<HealthCheckController>> _logger;

        [SetUp]
        public void Setup()
        {
            _videoApiClientMock = new Mock<IVideoApiClient>();
            _userApiClientMock = new Mock<IUserApiClient>();
            _bookingsApiClientMock = new Mock<IBookingsApiClient>();
            _logger = new Mock<ILogger<HealthCheckController>>();

            _controller = new HealthCheckController(_videoApiClientMock.Object, _userApiClientMock.Object, _logger.Object,
                _bookingsApiClientMock.Object);

            var judges = Builder<UserResponse>.CreateListOfSize(3).Build().ToList();
            _userApiClientMock.Setup(x => x.GetJudgesAsync())
                .ReturnsAsync(judges);
        }

        [Test]
        public async Task Should_return_internal_server_error_result_when_user_api_not_reachable()
        {
            var exception = new AggregateException("kinly api error");

            _userApiClientMock
                .Setup(x => x.GetJudgesAsync())
                .ThrowsAsync(exception);

            var result = await _controller.HealthAsync();
            var typedResult = (ObjectResult) result;
            typedResult.StatusCode.Should().Be((int) HttpStatusCode.InternalServerError);
            var response = (HealthCheckResponse) typedResult.Value;
            response.UserApiHealth.Successful.Should().BeFalse();
            response.UserApiHealth.ErrorMessage.Should().NotBeNullOrWhiteSpace();
        }
        
        [Test]
        public async Task Should_return_internal_server_error_result_when_bookings_api_not_reachable()
        {
            var exception = new AggregateException("kinly api error");

            _bookingsApiClientMock
                .Setup(x => x.GetCaseTypesAsync())
                .ThrowsAsync(exception);

            var result = await _controller.HealthAsync();
            var typedResult = (ObjectResult) result;
            typedResult.StatusCode.Should().Be((int) HttpStatusCode.InternalServerError);
            var response = (HealthCheckResponse) typedResult.Value;
            response.BookingsApiHealth.Successful.Should().BeFalse();
            response.BookingsApiHealth.ErrorMessage.Should().NotBeNullOrWhiteSpace();
        }
        
        [Test]
        public async Task Should_return_internal_server_error_result_when_video_api_not_reachable()
        {
            var exception = new VideoApiException<ProblemDetails>("Bad token", (int) HttpStatusCode.InternalServerError,
                "Please provide a valid conference Id", null, default(ProblemDetails), null);

            _videoApiClientMock
                .Setup(x => x.GetExpiredOpenConferencesAsync())
                .ThrowsAsync(exception);

            var result = await _controller.HealthAsync();
            var typedResult = (ObjectResult) result;
            typedResult.StatusCode.Should().Be((int) HttpStatusCode.InternalServerError);
            var response = (HealthCheckResponse) typedResult.Value;
            response.VideoApiHealth.Successful.Should().BeFalse();
            response.VideoApiHealth.ErrorMessage.Should().NotBeNullOrWhiteSpace();
        }

        [Test]
        public async Task Should_return_forbidden_error_result_when_video_api_not_reachable()
        {
            var exception = new VideoApiException<ProblemDetails>("Unauthorised Token", (int)HttpStatusCode.Unauthorized,
                "Invalid Client ID", null, default, null);

            _videoApiClientMock
                .Setup(x => x.GetExpiredOpenConferencesAsync())
                .ThrowsAsync(exception);

            var result = await _controller.HealthAsync();
            var typedResult = (ObjectResult)result;
            typedResult.StatusCode.Should().Be((int)HttpStatusCode.OK);
            var response = (HealthCheckResponse)typedResult.Value;
            response.VideoApiHealth.Successful.Should().BeTrue();
            response.VideoApiHealth.ErrorMessage.Should().BeNullOrWhiteSpace();
        }

        [Test]
        public async Task Should_return_internal_server_error_result_when_non_video_api_exception_thrown()
        {
            var exception = new UriFormatException("Test format is invalid");

            _bookingsApiClientMock
                .Setup(x => x.GetCaseTypesAsync())
                .ThrowsAsync(exception);

            var result = await _controller.HealthAsync();
            var typedResult = (ObjectResult) result;
            typedResult.StatusCode.Should().Be((int) HttpStatusCode.InternalServerError);
            var response = (HealthCheckResponse) typedResult.Value;
            response.BookingsApiHealth.Successful.Should().BeFalse();
            response.BookingsApiHealth.ErrorMessage.Should().NotBeNullOrWhiteSpace();
        }

        [Test]
        public async Task Should_return_ok_when_exception_is_not_internal_server_error()
        {
            var exception = new VideoApiException<ProblemDetails>("Bad Request", (int) HttpStatusCode.BadRequest,
                "Please provide a valid conference Id", null, default(ProblemDetails), null);

            _bookingsApiClientMock
                .Setup(x => x.BookNewHearingAsync(It.IsAny<BookNewHearingRequest>()))
                .ThrowsAsync(exception);

            var result = await _controller.HealthAsync();
            var typedResult = (ObjectResult) result;
            typedResult.StatusCode.Should().Be((int) HttpStatusCode.OK);
            var response = (HealthCheckResponse) typedResult.Value;
            response.BookingsApiHealth.Successful.Should().BeTrue();
        }

        [Test]
        public async Task Should_return_ok_when_all_services_are_running()
        {
            var result = await _controller.HealthAsync();
            var typedResult = (ObjectResult) result;
            typedResult.StatusCode.Should().Be((int) HttpStatusCode.OK);
            
            var response = (HealthCheckResponse) typedResult.Value;
            response.BookingsApiHealth.Successful.Should().BeTrue();
            response.UserApiHealth.Successful.Should().BeTrue();
            response.VideoApiHealth.Successful.Should().BeTrue();
            response.AppVersion.Should().NotBeNull();
            response.AppVersion.FileVersion.Should().NotBeNullOrWhiteSpace();
            response.AppVersion.InformationVersion.Should().NotBeNullOrWhiteSpace();
        }
    }
}
