
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using VideoWeb.Contract.Responses;

namespace VideoWeb.UnitTests.Controllers.TokenController
{
    public class GetJwTokenTests: TokenControllerTest
    {
        [Test]
        public void Should_return_ok_token_response()
        {
            var result = _tokenController.GetJwToken(participantId);

            var typedResult = (OkObjectResult)result;
            typedResult.Should().NotBeNull();
            var tokenResponse = (TokenResponse)typedResult.Value;
            tokenResponse.Token.Should().Be(token);
            tokenResponse.ExpiresOn.Length.Should().Be(19);
            customJwtTokenProvider.Verify(v => v.GenerateToken(It.IsAny<string>(), It.IsAny<int>()), Times.Once);
        }
    }
}
