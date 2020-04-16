using System.Net;
using System.Security.Claims;
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
    public class GetUserProfileTests
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
                .WithRole(Role.Judge)
                .WithClaim(ClaimTypes.GivenName, "John")
                .WithClaim(ClaimTypes.Surname, "Doe")
                .WithClaim(ClaimTypes.Name, "John D")
                .Build();
            _controller = SetupControllerWithClaims(claimsPrincipal);
        }

        [Test]
        public void Should_return_ok_code_when_user_profile_found()
        {
            var result = _controller.GetUserProfile();
            var typedResult = (OkObjectResult) result;
            typedResult.Should().NotBeNull();
        }

        [Test]
        public void Should_return_401_when_exception_thrown()
        {
            // missing claim will throw an exception
            var claimsPrincipal = new ClaimsPrincipalBuilder()
                .WithClaim(ClaimTypes.GivenName, "John")
                .WithClaim(ClaimTypes.Surname, "Doe")
                .Build();
            _controller = SetupControllerWithClaims(claimsPrincipal);
            var apiException = new UserApiException<ProblemDetails>("Internal Server Error",
                (int) HttpStatusCode.InternalServerError,
                "Stacktrace goes here", null, default, null);
            _userApiClientMock
                .Setup(x => x.GetUserByAdUserNameAsync(It.IsAny<string>()))
                .ThrowsAsync(apiException);

            var result = _controller.GetUserProfile();
            var typedResult = (ObjectResult) result;
            typedResult.StatusCode.Should().Be((int) HttpStatusCode.Unauthorized);

        }

        private ProfilesController SetupControllerWithClaims(ClaimsPrincipal claimsPrincipal)
        {
            var context = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = claimsPrincipal
                }
            };

            return new ProfilesController(_userApiClientMock.Object, _mockLogger.Object, new DictionaryUserCache())
            {
                ControllerContext = context
            };
        }
    }
}
