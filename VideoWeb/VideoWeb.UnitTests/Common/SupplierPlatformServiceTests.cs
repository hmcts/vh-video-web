using FluentAssertions;
using Moq;
using NUnit.Framework;
using VideoWeb.Common;
using VideoWeb.Common.Security.HashGen;
using VideoWeb.Common.Security.Tokens.Base;

namespace VideoWeb.UnitTests.Common
{
    public class SupplierPlatformServiceTests
    {
        private Mock<IJwtTokenProvider> _jwtTokenProvider;
        private SupplierConfiguration _supplierConfiguration;
        private SupplierPlatformService _sut;
        
        [SetUp]
        public void SetUp()
        {
            _jwtTokenProvider = new Mock<IJwtTokenProvider>();
            _supplierConfiguration = new KinlyConfiguration
            {
                HeartbeatUrlBase = "kinly-heartbeat-url-base"
            };

            _sut = new SupplierPlatformService(_jwtTokenProvider.Object, _supplierConfiguration);
        }
        
        [Test]
        public void Should_return_token_provider()
        {
            // Arrange & Act
            var tokenProvider = _sut.GetTokenProvider();

            // Assert
            tokenProvider.Should().BeEquivalentTo(_jwtTokenProvider.Object);
        }

        [Test]
        public void Should_return_supplier_configuration()
        {
            // Arrange & Act
            var supplierConfig = _sut.GetSupplierConfiguration();
            
            // Assert
            supplierConfig.Should().BeEquivalentTo(_supplierConfiguration);
        }
    }
}
