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
            var result = _tokenController.GetToken(participantId);

            var typedResult = (OkObjectResult)result;
            typedResult.Should().NotBeNull();
            var tokenResponse = (TokenResponse)typedResult.Value;
            tokenResponse.Token.Should().Be(token);
            tokenResponse.ExpiresOn.Length.Should().BeGreaterThan(15);
            hashGenerator.Verify(h => h.GenerateHash(It.IsAny<string>(), It.IsAny<string>()), Times.Once);
        }
    }
}
