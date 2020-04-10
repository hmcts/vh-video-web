
using Moq;
using NUnit.Framework;
using System;
using VideoWeb.Common.Security;
using VideoWeb.Common.Security.HashGen;

namespace VideoWeb.UnitTests.Controllers.TokenController
{
    public class TokenControllerTest
    {
        public VideoWeb.Controllers.TokenController _tokenController;
        protected Mock<IHashGenerator> hashGenerator;
        protected Mock<ICustomJwtTokenProvider> customJwtTokenProvider;
        protected Guid participantId;
        protected string token;

        [SetUp]
        public void Setup()
        {
            hashGenerator = new Mock<IHashGenerator>();
            customJwtTokenProvider = new Mock<ICustomJwtTokenProvider>();
            participantId = Guid.NewGuid();
            token = "TestToken";
            hashGenerator.Setup(h => h.GenerateSelfTestTokenHash(It.IsAny<string>(), It.IsAny<string>())).Returns(token);
            customJwtTokenProvider.Setup(v => v.GenerateToken(It.IsAny<string>(), It.IsAny<int>())).Returns(token);

            _tokenController = new VideoWeb.Controllers.TokenController(hashGenerator.Object, 
                                                                        customJwtTokenProvider.Object, 
                                                                        new KinlyConfiguration() { HashExpiresInMinutes = 30, ExpiresInMinutes = 20 });
        }
    }
}
