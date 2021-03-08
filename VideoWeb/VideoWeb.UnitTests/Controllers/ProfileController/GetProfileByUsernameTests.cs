using System.Net;
using System.Security.Claims;
using System.Threading.Tasks;
using Autofac.Extras.Moq;
using FizzWare.NBuilder;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Controllers;
using VideoWeb.Mappings;
using UserApi.Client;
using UserApi.Contract.Responses;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.Controllers.ProfileController
{
    public class GetProfileByUsernameTests
    {
        private AutoMock _mocker;
        private ProfilesController _sut;

        [SetUp]
        public void Setup()
        {
            _mocker = AutoMock.GetLoose();
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

            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<UserProfile, UserProfileResponse>()).Returns(_mocker.Create<UserProfileToUserProfileResponseMapper>());
            var parameters = new ParameterBuilder(_mocker).AddObject(new DictionaryUserCache()).Build();
            _sut = _mocker.Create<ProfilesController>(parameters);
            _sut.ControllerContext = context;
        }

        [Test]
        public async Task Should_return_ok_code_when_user_profile_found()
        {
            var username = "judge@hmcts.net";
            var profile = Builder<UserProfile>.CreateNew().With(x => x.UserRole = "Judge")
                .With(x => x.UserName = username).Build();
            _mocker.Mock<IUserApiClient>()
                .Setup(x => x.GetUserByAdUserNameAsync(It.IsAny<string>()))
                .ReturnsAsync(profile);
            var result = await _sut.GetProfileByUsernameAsync(username);
            var typedResult = (OkObjectResult) result;
            typedResult.Should().NotBeNull();
        }

        [Test]
        public async Task Should_return_not_found_code_when_user_profile_is_not_found()
        {
            var username = "judge@hmcts.net";
            var apiException = new UserApiException<ProblemDetails>("User not found", (int) HttpStatusCode.NotFound,
                "User Not Found", null, default, null);
            _mocker.Mock<IUserApiClient>()
                .Setup(x => x.GetUserByAdUserNameAsync(It.IsAny<string>()))
                .ThrowsAsync(apiException);

            var result = await _sut.GetProfileByUsernameAsync(username);
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
            _mocker.Mock<IUserApiClient>()
                .Setup(x => x.GetUserByAdUserNameAsync(It.IsAny<string>()))
                .ThrowsAsync(apiException);

            var result = await _sut.GetProfileByUsernameAsync(username);
            var typedResult = (ObjectResult) result;
            typedResult.StatusCode.Should().Be((int) HttpStatusCode.InternalServerError);
        }
    }
}
