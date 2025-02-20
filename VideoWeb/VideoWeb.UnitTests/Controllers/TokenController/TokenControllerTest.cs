
using Moq;
using NUnit.Framework;
using System;
using VideoWeb.Common.Security.HashGen;
using VideoWeb.Common.Security.Tokens.Base;

namespace VideoWeb.UnitTests.Controllers.TokenController
{
    public class TokenControllerTest
    {
        public VideoWeb.Controllers.TokenController TokenController;
        protected Mock<IHashGenerator> hashGenerator;
        protected Mock<IJwtTokenProvider> JwtTokenProvider;
        protected Guid participantId;
        protected string token;

        [SetUp]
        public void Setup()
        {
            hashGenerator = new Mock<IHashGenerator>();
            JwtTokenProvider = new Mock<IJwtTokenProvider>();
            participantId = Guid.NewGuid();
            token = "TestToken";
            hashGenerator.Setup(h => h.GenerateSelfTestTokenHash(It.IsAny<string>(), It.IsAny<string>())).Returns(token);
            JwtTokenProvider.Setup(v => v.GenerateToken(It.IsAny<string>(), It.IsAny<int>())).Returns(token);

            TokenController = new VideoWeb.Controllers.TokenController(hashGenerator.Object, new VodafoneConfiguration() { HashExpiresInMinutes = 30, ExpiresInMinutes = 20 });
        }
    }
}
