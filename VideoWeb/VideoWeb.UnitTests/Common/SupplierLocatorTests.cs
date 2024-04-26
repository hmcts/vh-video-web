using System;
using FluentAssertions;
using Microsoft.Extensions.Options;
using Moq;
using NUnit.Framework;
using VideoWeb.Common;
using VideoWeb.Common.Security;
using VideoWeb.Common.Security.HashGen;
using VideoWeb.Common.Security.Tokens.Kinly;
using VideoWeb.Common.Security.Tokens.Vodafone;

namespace VideoWeb.UnitTests.Common;

[TestFixture]
public class SupplierLocatorTests
{
    private Mock<IFeatureToggles> _featureToggles;
    private Mock<IOptions<KinlyConfiguration>> _kinlyConfigOptions;
    private Mock<IOptions<VodafoneConfiguration>> _vodafoneConfigOptions;
    private Mock<IServiceProvider> _serviceProvider;

    [SetUp]
    public void Setup()
    {
        _featureToggles = new Mock<IFeatureToggles>();
        _kinlyConfigOptions = new Mock<IOptions<KinlyConfiguration>>();
        _vodafoneConfigOptions = new Mock<IOptions<VodafoneConfiguration>>();
        _serviceProvider = new Mock<IServiceProvider>();
        
        _serviceProvider.Setup(x => x.GetService(typeof(IVodafoneJwtTokenProvider)))
            .Returns(new VodafoneJwtTokenProvider(new VodafoneConfiguration()));
        
        _serviceProvider.Setup(x => x.GetService(typeof(IKinlyJwtTokenProvider)))
            .Returns(new KinlyJwtTokenProvider(new KinlyConfiguration()));
    }
    
    [TestCase(true)]
    [TestCase(false)]
    public void Should_return_token_provider(bool isVodafone)
    {
        // Arrange
        _featureToggles.Setup(x => x.Vodafone()).Returns(isVodafone);
        var sut = new SupplierLocator(_serviceProvider.Object,
            _featureToggles.Object,
            _kinlyConfigOptions.Object,
            _vodafoneConfigOptions.Object);
            
        // Act
        var tokenProvider = sut.GetTokenProvider();

        // Assert
        if (isVodafone)
            tokenProvider.Should().BeOfType<VodafoneJwtTokenProvider>();
        else
            tokenProvider.Should().BeOfType<KinlyJwtTokenProvider>();
    }
    
    
    [TestCase(true)]
    [TestCase(false)]
    public void Should_return_supplier_configuration(bool isVodafone)
    {
        // Arrange
        _featureToggles.Setup(x => x.Vodafone()).Returns(isVodafone);
        var sut = new SupplierLocator(_serviceProvider.Object,
            _featureToggles.Object,
            _kinlyConfigOptions.Object,
            _vodafoneConfigOptions.Object);

        // Act
        var supplierConfiguration = sut.GetSupplierConfiguration();

        // Assert
        if (isVodafone)
            supplierConfiguration.Should().Be(_vodafoneConfigOptions.Object);
        else
            supplierConfiguration.Should().Be(_kinlyConfigOptions.Object);
    }
    
    
}
