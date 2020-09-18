using System.Net;
using System.Security.Claims;
using System.Threading.Tasks;
using FizzWare.NBuilder;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoWeb.Controllers;
using VideoWeb.Services.User;
using VideoWeb.UnitTests.Builders;
using ProblemDetails = VideoWeb.Services.User.ProblemDetails;

namespace VideoWeb.UnitTests.Controllers.ProfileController
{
    public class GetProfileByUsernameTests
    {
        private ProfilesController _controller;
        private Mock<IUserApiClient> _userApiClientMock;
        private Mock<ILogger<ProfilesController>> _mockLogger;

        [SetUp]
        public void Setup()
        {
            _userApiClientMock = new Mock<IUserApiClient>();
            _mockLogger = new Mock<ILogger<ProfilesController>>();
            var claimsPrincipal = new ClaimsPrincipalBuilder()
                .WithRole(AppRoles.JudgeRole)
                .WithClaim(ClaimTypes.GivenName, "John")
                .WithClaim(ClaimTypes.Surname, "Doe")
                .WithClaim("name", "John D")
                .Build();
            var context = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = claimsPrincipal
                }
            };

            _controller =
                new ProfilesController(_userApiClientMock.Object, _mockLogger.Object, new DictionaryUserCache())
                {
                    ControllerContext = context
                };
        }

        [Test]
        public async Task Should_return_ok_code_when_user_profile_found()
        {
            var username = "judge@hmcts.net";
            var profile = Builder<UserProfile>.CreateNew().With(x => x.User_role = "Judge")
                .With(x => x.User_name = username).Build();
            _userApiClientMock
                .Setup(x => x.GetUserByAdUserNameAsync(It.IsAny<string>()))
                .ReturnsAsync(profile);
            var result = await _controller.GetProfileByUsernameAsync(username);
            var typedResult = (OkObjectResult) result;
            typedResult.Should().NotBeNull();
        }

        [Test]
        public async Task Should_return_not_found_code_when_user_profile_is_not_found()
        {
            var username = "judge@hmcts.net";
            var apiException = new UserApiException<ProblemDetails>("User not found", (int) HttpStatusCode.NotFound,
                "User Not Found", null, default, null);
            _userApiClientMock
                .Setup(x => x.GetUserByAdUserNameAsync(It.IsAny<string>()))
                .ThrowsAsync(apiException);

            var result = await _controller.GetProfileByUsernameAsync(username);
            var typedResult = (ObjectResult) result;
            typedResult.StatusCode.Should().Be((int) HttpStatusCode.NotFound);
        }

        [Test]
        public async Task Should_return_internal_server_error_when_exception_thrown()
        {
            var username = "judge@hmcts.net";
            var apiException = new UserApiException<ProblemDetails>("Internal Server Error",
                (int) HttpStatusCode.InternalServerError,
                "Stacktrace goes here", null, default, null);
            _userApiClientMock
                .Setup(x => x.GetUserByAdUserNameAsync(It.IsAny<string>()))
                .ThrowsAsync(apiException);

            var result = await _controller.GetProfileByUsernameAsync(username);
            var typedResult = (ObjectResult) result;
            typedResult.StatusCode.Should().Be((int) HttpStatusCode.InternalServerError);
        }
    }
}
