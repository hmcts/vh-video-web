using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Autofac.Extras.Moq;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Moq;
using NUnit.Framework;
using VideoWeb.Middleware;
using VideoWeb.Common.Models;
using VideoWeb.Services;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.Middleware
{
    public class UserClaimsMiddlewareTests
    {
        private AutoMock _mocker;
        private UserClaimsMiddleware _sut;
        private Mock<IDelegateMock> _requestDelegateMock;

        [SetUp]
        public void Setup()
        {
            _mocker = AutoMock.GetLoose();
            _requestDelegateMock = new Mock<IDelegateMock>();
            _sut = new UserClaimsMiddleware(_requestDelegateMock.Object.RequestDelegate);
        }

        [Test]
        public async Task should_invoke_app_role_service_when_user_is_authenticated()
        {
            // arrange
            var claimsPrincipal = new ClaimsPrincipalBuilder()
                .WithClaim(UserClaimsMiddleware.OidClaimType, Guid.NewGuid().ToString()).Build();

            _mocker.Mock<IServiceProvider>()
                .Setup(x => x.GetService(typeof(IAppRoleService)))
                .Returns(_mocker.Mock<IAppRoleService>().Object);
            var httpContext = new DefaultHttpContext()
            {
                User = claimsPrincipal,
                RequestServices = _mocker.Mock<IServiceProvider>().Object
            };
            
            _mocker.Mock<IAppRoleService>().Setup(x => x.GetClaimsForUserAsync(It.IsAny<string>(), It.IsAny<string>()))
                .ReturnsAsync(new List<Claim>(){ new(ClaimTypes.Role, AppRoles.JudgeRole) });

            // act
            await _sut.InvokeAsync(httpContext);

            // assert
            _requestDelegateMock.Verify(x => x.RequestDelegate(It.IsAny<HttpContext>()), Times.Once);
            claimsPrincipal.IsInRole(AppRoles.JudgeRole).Should().BeTrue();
        }

        [Test]
        public async Task should_not_invoke_app_role_service_when_user_is_not_authenticated()
        {
            // arrange
            var httpContext = new DefaultHttpContext()
            {
                User = _mocker.Mock<ClaimsPrincipal>().Object,
                RequestServices = _mocker.Mock<IServiceProvider>().Object
            };

            // act
            await _sut.InvokeAsync(httpContext);

            // assert
            _requestDelegateMock.Verify(x => x.RequestDelegate(It.IsAny<HttpContext>()), Times.Once);
            _mocker.Mock<IAppRoleService>().Verify(x => x.GetClaimsForUserAsync(It.IsAny<string>(), It.IsAny<string>()), Times.Never);
            _mocker.Mock<ClaimsPrincipal>().Verify(x => x.AddIdentity(It.IsAny<ClaimsIdentity>()), Times.Never);
        }
    }
    
    public interface IDelegateMock
    {
        Task RequestDelegate(HttpContext context);
    }
}
