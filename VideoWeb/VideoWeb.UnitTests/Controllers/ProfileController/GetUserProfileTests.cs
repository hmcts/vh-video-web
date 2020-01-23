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
            var claimsPrincipal = new ClaimsPrincipalBuilder().Build();
            var context = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = claimsPrincipal
                }
            };

            _controller = new ProfilesController(_userApiClientMock.Object, _mockLogger.Object)
            {
                ControllerContext = context
            };
        }
        
        [Test]
        public async Task should_return_ok_code_when_user_profile_found()
        {
            var userProfile = new UserProfile() {User_role = "Judge"};
            _userApiClientMock
                .Setup(x => x.GetUserByAdUserNameAsync(It.IsAny<string>()))
                .ReturnsAsync(userProfile);

            var result = await _controller.GetUserProfile();
            var typedResult = (OkObjectResult) result;
            typedResult.Should().NotBeNull();
        }
        
        [Test]
        public async Task should_return_not_found_code_when_user_profile_is_not_found()
        {
            var apiException = new UserApiException<ProblemDetails>("User not found", (int) HttpStatusCode.NotFound,
                "User Not Found", null, default(ProblemDetails), null);
            _userApiClientMock
                .Setup(x => x.GetUserByAdUserNameAsync(It.IsAny<string>()))
                .ThrowsAsync(apiException);

            var result = await _controller.GetUserProfile();
            var typedResult = (ObjectResult) result;
            typedResult.StatusCode.Should().Be((int) HttpStatusCode.NotFound);
        }
        
        [Test]
        public async Task should_return_exception()
        {
            var apiException = new UserApiException<ProblemDetails>("Internal Server Error", (int) HttpStatusCode.InternalServerError,
                "Stacktrace goes here", null, default, null);
            _userApiClientMock
                .Setup(x => x.GetUserByAdUserNameAsync(It.IsAny<string>()))
                .ThrowsAsync(apiException);

            var result = await _controller.GetUserProfile();
            var typedResult = (ObjectResult)result;
            typedResult.StatusCode.Should().Be((int) HttpStatusCode.InternalServerError);
        } 
    }
}