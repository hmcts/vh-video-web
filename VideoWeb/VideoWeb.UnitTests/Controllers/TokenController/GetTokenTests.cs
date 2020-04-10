using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using VideoWeb.Contract.Responses;

namespace VideoWeb.UnitTests.Controllers.TokenController
{
    public class GetTokenTests: TokenControllerTest
    {
        [Test]
        public void should_return_ok_token_response()
        { 
            var result = _tokenController.GetSelfTestToken(participantId);

            var typedResult = (OkObjectResult)result;
            typedResult.Should().NotBeNull();
            var tokenResponse = (TokenResponse)typedResult.Value;
            tokenResponse.Token.Should().Be(token);
            tokenResponse.ExpiresOn.Length.Should().BeGreaterOrEqualTo(15);
            tokenResponse.ExpiresOn.Length.Should().BeLessOrEqualTo(17);
            hashGenerator.Verify(h => h.GenerateSelfTestTokenHash(It.IsAny<string>(), It.IsAny<string>()), Times.Once);
        }
    }
}
