
using Moq;
using NUnit.Framework;
using System;
using VideoWeb.Common.Security;
using VideoWeb.Common.Security.HashGen;

namespace VideoWeb.UnitTests.Controllers.TokenController
{
    public class TokenControllerTest
    {
        public VideoWeb.Controllers.TokenController TokenController;
        protected Mock<IHashGenerator> hashGenerator;
        protected Mock<IKinlyJwtTokenProvider> kinlyJwtTokenProvider;
        protected Guid participantId;
        protected string token;

        [SetUp]
        public void Setup()
        {
            hashGenerator = new Mock<IHashGenerator>();
            kinlyJwtTokenProvider = new Mock<IKinlyJwtTokenProvider>();
            participantId = Guid.NewGuid();
            token = "TestToken";
            hashGenerator.Setup(h => h.GenerateSelfTestTokenHash(It.IsAny<string>(), It.IsAny<string>())).Returns(token);
            kinlyJwtTokenProvider.Setup(v => v.GenerateToken(It.IsAny<string>(), It.IsAny<int>())).Returns(token);

            TokenController = new VideoWeb.Controllers.TokenController(hashGenerator.Object, new KinlyConfiguration() { HashExpiresInMinutes = 30, ExpiresInMinutes = 20 });
        }
    }
}
