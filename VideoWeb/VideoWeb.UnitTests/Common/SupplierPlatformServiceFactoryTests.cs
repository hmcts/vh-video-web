using System;
using FluentAssertions;
using Microsoft.Extensions.Options;
using Moq;
using NUnit.Framework;
using VideoWeb.Common;
using VideoWeb.Common.Enums;
using VideoWeb.Common.Security.HashGen;
using VideoWeb.Common.Security.Tokens.Kinly;
using VideoWeb.Common.Security.Tokens.Vodafone;

namespace VideoWeb.UnitTests.Common
{
    public class SupplierPlatformServiceFactoryTests
    {
        private Mock<IServiceProvider> _serviceProvider;
        
        [SetUp]
        public void SetUp()
        {
            _serviceProvider = new Mock<IServiceProvider>();
            var kinlyJwtTokenProvider = new Mock<IKinlyJwtTokenProvider>();
            var vodafoneJwtTokenProvider = new Mock<IVodafoneJwtTokenProvider>();
            var kinlyConfig = new KinlyConfiguration();
            var vodafoneConfig = new VodafoneConfiguration();
            var kinlyConfigOptions = new Mock<IOptions<KinlyConfiguration>>();
            var vodafoneConfigOptions = new Mock<IOptions<VodafoneConfiguration>>();
            kinlyConfigOptions.Setup(m => m.Value).Returns(kinlyConfig);
            vodafoneConfigOptions.Setup(m => m.Value).Returns(vodafoneConfig);
            _serviceProvider.Setup(x => x.GetService(typeof(IKinlyJwtTokenProvider))).Returns(kinlyJwtTokenProvider.Object);
            _serviceProvider.Setup(x => x.GetService(typeof(IVodafoneJwtTokenProvider))).Returns(vodafoneJwtTokenProvider.Object);
            _serviceProvider.Setup(x => x.GetService(typeof(IOptions<KinlyConfiguration>))).Returns(kinlyConfigOptions.Object);
            _serviceProvider.Setup(x => x.GetService(typeof(IOptions<VodafoneConfiguration>))).Returns(vodafoneConfigOptions.Object);
        }
        
        [Test]
        public void Should_create_supplier_platform_service_for_kinly()
        {
            // Arrange
            var sut = new SupplierPlatformServiceFactory(_serviceProvider.Object);

            // Act
            var service = sut.Create(Supplier.Kinly);

            // Assert
            service.Should().BeOfType<SupplierPlatformService>();
            service.Should().NotBeNull();
            var tokenProvider = service.GetTokenProvider();
            var supplierConfiguration = service.GetSupplierConfiguration();
            tokenProvider.Should().BeAssignableTo<IKinlyJwtTokenProvider>();
            supplierConfiguration.Should().BeAssignableTo<KinlyConfiguration>();
        }
        
        [Test]
        public void Should_create_supplier_platform_service_for_vodafone()
        {
            // Arrange
            var sut = new SupplierPlatformServiceFactory(_serviceProvider.Object);

            // Act
            var service = sut.Create(Supplier.Vodafone);

            // Assert
            service.Should().BeOfType<SupplierPlatformService>();
            service.Should().NotBeNull();
            var tokenProvider = service.GetTokenProvider();
            var supplierConfiguration = service.GetSupplierConfiguration();
            tokenProvider.Should().BeAssignableTo<IVodafoneJwtTokenProvider>();
            supplierConfiguration.Should().BeAssignableTo<VodafoneConfiguration>();
        }
    }
}
