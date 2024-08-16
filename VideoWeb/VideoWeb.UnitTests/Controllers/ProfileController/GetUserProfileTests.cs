using System.Linq;
using System.Net;
using System.Security.Claims;
using Autofac.Extras.Moq;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using NUnit.Framework;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Controllers;
using VideoWeb.UnitTests.Builders;

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
                .WithClaim(ClaimTypes.Name, "John D")
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
                .Be(_claimsPrincipal.Claims.LastOrDefault(x => x.Type == ClaimTypes.GivenName)?.Value);
            userProfile.LastName.Should()
                .Be(_claimsPrincipal.Claims.LastOrDefault(x => x.Type == ClaimTypes.Surname)?.Value);
            userProfile.DisplayName.Should()
                .Be(_claimsPrincipal.Claims.LastOrDefault(x => x.Type == ClaimTypes.Name)?.Value);
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

            var controller = _mocker.Create<ProfilesController>();
            controller.ControllerContext = context;
            return controller;
        }
    }
}
