using System.Linq;
using System.Net;
using System.Security.Claims;
using Autofac.Extras.Moq;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Controllers;
using VideoWeb.Mappings;
using VideoWeb.Services.User;
using VideoWeb.UnitTests.Builders;
using ProblemDetails = VideoWeb.Services.User.ProblemDetails;

namespace VideoWeb.UnitTests.Controllers.ProfileController
{
    public class GetUserProfileTests
    {
        private AutoMock _mocker;
        private ProfilesController _sut;
        private ClaimsPrincipal _claimsPrincipal;

        [SetUp]
        public void Setup()

        {
            _mocker = AutoMock.GetLoose();
            _claimsPrincipal = new ClaimsPrincipalBuilder()
                .WithRole(AppRoles.JudgeRole)
                .WithClaim(ClaimTypes.GivenName, "John")
                .WithClaim(ClaimTypes.Surname, "Doe")
                .WithClaim("name", "John D")
                .Build();
            _sut = SetupControllerWithClaims(_claimsPrincipal);
        }

        [Test]
        public void Should_return_ok_code_when_user_profile_found()
        {
            var result = _sut.GetUserProfile();
            var typedResult = (OkObjectResult) result;
            typedResult.Should().NotBeNull();

            var userProfile = (UserProfileResponse) typedResult.Value;
            userProfile.FirstName.Should()
                .Be(_claimsPrincipal.Claims.FirstOrDefault(x => x.Type == ClaimTypes.GivenName)?.Value);
            userProfile.LastName.Should()
                .Be(_claimsPrincipal.Claims.FirstOrDefault(x => x.Type == ClaimTypes.Surname)?.Value);
            userProfile.DisplayName.Should()
                .Be(_claimsPrincipal.Claims.FirstOrDefault(x => x.Type == "name")?.Value);
        }

        [Test]
        public void Should_return_401_when_exception_thrown()
        {
            // missing claim will throw an exception
            var claimsPrincipal = new ClaimsPrincipalBuilder()
                .WithClaim(ClaimTypes.GivenName, "John")
                .WithClaim(ClaimTypes.Surname, "Doe")
                .Build();
            _sut = SetupControllerWithClaims(claimsPrincipal);
            var apiException = new UserApiException<ProblemDetails>("Internal Server Error",
                (int) HttpStatusCode.InternalServerError,
                "Stacktrace goes here", null, default, null);
            _mocker.Mock<IUserApiClient>()
                .Setup(x => x.GetUserByAdUserNameAsync(It.IsAny<string>()))
                .ThrowsAsync(apiException);

            var result = _sut.GetUserProfile();
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

            var parameters = new ParameterBuilder(_mocker).AddObjectAsImplementedInterfaces(new DictionaryUserCache()).Build();
            var controller = _mocker.Create<ProfilesController>(parameters);
            controller.ControllerContext = context;
            return controller;
        }
    }
}
