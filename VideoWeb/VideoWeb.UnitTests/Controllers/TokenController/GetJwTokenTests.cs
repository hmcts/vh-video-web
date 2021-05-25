
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using VideoWeb.Contract.Responses;
using Microsoft.AspNetCore.Http;
using VideoWeb.Common.Models;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.Controllers.TokenController
{
    public class GetJwTokenTests: TokenControllerTest
    {
        [Test]
        public void Should_return_ok_token_response()
        {
            var cp = new ClaimsPrincipalBuilder().WithRole(AppRoles.VhOfficerRole)
                .WithUsername("vho@test.com").Build();
            var context = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = cp
                }
            };

            TokenController.ControllerContext = context;

            var result = TokenController.GetJwToken(participantId);

            var typedResult = (OkObjectResult)result;
            typedResult.Should().NotBeNull();
            var tokenResponse = (TokenResponse)typedResult.Value;
            tokenResponse.Token.Should().Be(token);
            tokenResponse.ExpiresOn.Length.Should().Be(19);
            customJwtTokenProvider.Verify(v => v.GenerateToken(It.IsAny<string>(), It.IsAny<int>(), It.IsAny<string>()), Times.Once);
        }

        [Test]
        public void Should_return_admin_token_response()
        {
            var cp = new ClaimsPrincipalBuilder().WithRole(AppRoles.JudgeRole)
                .WithUsername("judge@test.com").Build();
            var context = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = cp
                }
            };

            TokenController.ControllerContext = context;

            var result = TokenController.GetJwToken(participantId);

            var typedResult = (OkObjectResult)result;
            typedResult.Should().NotBeNull();
            var tokenResponse = (TokenResponse)typedResult.Value;
            tokenResponse.Token.Should().Be(token);
            tokenResponse.ExpiresOn.Length.Should().Be(19);
            customJwtTokenProvider.Verify(v => v.GenerateToken(It.IsAny<string>(), It.IsAny<int>(), It.IsAny<string>()), Times.Once);
        }
    }
}
