using System.Collections.Generic;
using Autofac.Extras.Moq;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Moq;
using NUnit.Framework;
using VideoWeb.Common;
using VideoWeb.Common.Configuration;
using VideoWeb.Common.Security.HashGen;
using VideoWeb.Contract.Responses;
using VideoWeb.Controllers;
using VideoWeb.Mappings;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.Controllers.ConfigSettingController;

public class GetClientConfigurationSettingsTests
{
    private AutoMock _mocker;
    
    [SetUp]
    public void Setup()
    {
        _mocker = AutoMock.GetLoose();
        _mocker.Mock<IFeatureToggles>()
            .Setup(x => x.Vodafone())
            .Returns(true);
    }
    
    [Test]
    public void Should_return_response_with_settings_with_vodafone_enabled()
    {
        // Arrange
        var kinlyConfiguration = new KinlyConfiguration
        {
            JoinByPhoneFromDate = "2021-02-09"
        };
        var vodafoneConfiguration = new VodafoneConfiguration
        {
            JoinByPhoneFromDate = "2022-02-09"
        };
        var supplierConfigurations = new List<SupplierConfiguration>
        {
            kinlyConfiguration,
            vodafoneConfiguration
        };
        var configSettingsController = SetUpController(supplierConfigurations);
        _mocker.Mock<IFeatureToggles>()
            .Setup(x => x.Vodafone())
            .Returns(true);
        
        // Act
        var response = configSettingsController.GetClientConfigurationSettings();
        
        // Assert
        AssertResponse(response, supplierConfigurations);
    }
    
    [Test]
    public void Should_return_response_with_settings_with_vodafone_disabled()
    {
        // Arrange
        var kinlyConfiguration = new KinlyConfiguration
        {
            JoinByPhoneFromDate = "2021-02-09"
        };
        var supplierConfigurations = new List<SupplierConfiguration>
        {
            kinlyConfiguration
        };
        var configSettingsController = SetUpController(supplierConfigurations);
        _mocker.Mock<IFeatureToggles>()
            .Setup(x => x.Vodafone())
            .Returns(false);
        
        // Act
        var response = configSettingsController.GetClientConfigurationSettings();
        
        // Assert
        AssertResponse(response, supplierConfigurations);
    }
    
    [Test]
    public void should_return_bad_request_when_config_is_missing()
    {
        var securitySettings = new AzureAdConfiguration
        {
            ClientId = "ClientId",
            ClientSecret = "ClientSecret",
            TenantId = "TenantId",
            Authority = "Authority",
            ApplicationInsights = new ApplicationInsightsConfiguration { ConnectionString = "InstrumentationKey=AiKey" }
        };
        
        var servicesConfiguration = new HearingServicesConfiguration
        {
            VideoApiUrl = "https://vh-video-api/"
        };
        
        var kinlyConfiguration = new KinlyConfiguration
        {
            JoinByPhoneFromDate = "2021-02-09"
        };
        
        var vodafoneConfiguration = new VodafoneConfiguration
        {
            JoinByPhoneFromDate = "2022-02-09"
        };

        var supplierConfigurations = new List<SupplierConfiguration>
        {
            kinlyConfiguration,
            vodafoneConfiguration
        };

        foreach (var supplierConfiguration in supplierConfigurations)
        {
            SetUpPlatformService(supplierConfiguration);
        }

        var parameters = new ParameterBuilder(_mocker).AddObject(Options.Create(securitySettings))
            .AddObject(Options.Create(servicesConfiguration))
            .Build();
        
        var configSettingsController = _mocker.Create<ConfigSettingsController>(parameters);
        
        var result = configSettingsController.GetClientConfigurationSettings();
        result.Should().BeOfType<ActionResult<ClientSettingsResponse>>().Which.Result.Should().BeOfType<BadRequestObjectResult>();
    }

    private ConfigSettingsController SetUpController(List<SupplierConfiguration> supplierConfigurations)
    {
        var securitySettings = new AzureAdConfiguration
        {
            ClientId = "ClientId",
            ClientSecret = "ClientSecret",
            TenantId = "TenantId",
            Authority = "Authority",
            ApplicationInsights = new ApplicationInsightsConfiguration { ConnectionString = "InstrumentationKey=AiKey" }
        };
        
        var eJudAdConfiguration = new EJudAdConfiguration()
        {
            ClientId = "EjudClientId",
            TenantId = "EjudTenantId",
            Authority = "EjudAuthority",
            RedirectUri = "EjudRedirectUri",
            PostLogoutRedirectUri = "EjudPostLogoutRedirectUri"
        };
        
        var dom1AdConfiguration = new Dom1AdConfiguration()
        {
            ClientId = "Dom1ClientId",
            TenantId = "Dom1TenantId",
            Authority = "Dom1Authority",
            RedirectUri = "Dom1RedirectUri",
            PostLogoutRedirectUri = "Dom1PostLogoutRedirectUri"
        };
        
        var servicesConfiguration = new HearingServicesConfiguration
        {
            VideoApiUrl = "https://vh-video-api/",
            EnableVideoFilters = true,
            EnableDynamicEvidenceSharing = true,
            BlurRadius = 20
        };

        var dynatraceConfiguration = new DynatraceConfiguration
        {
            DynatraceRumLink = "dynatraceRumLink.js"
        };

        foreach (var supplierConfiguration in supplierConfigurations)
        {
            SetUpPlatformService(supplierConfiguration);
        }

        var parameters = new ParameterBuilder(_mocker)
            .AddObject(Options.Create(securitySettings))
            .AddObject(Options.Create(servicesConfiguration))
            .AddObject(Options.Create(eJudAdConfiguration))
            .AddObject(Options.Create(dom1AdConfiguration))
            .AddObject(Options.Create(dynatraceConfiguration))
            .Build();
        
        var configSettingsController = _mocker.Create<ConfigSettingsController>(parameters);

        return configSettingsController;
    }
    
    private void SetUpPlatformService(SupplierConfiguration supplierConfiguration)
    {
        var platformService = new Mock<ISupplierPlatformService>();
        platformService
            .Setup(x => x.GetSupplierConfiguration())
            .Returns(supplierConfiguration);

        _mocker.Mock<ISupplierPlatformServiceFactory>()
            .Setup(x => x.Create(supplierConfiguration.Supplier))
            .Returns(platformService.Object);
    }

    private static void AssertResponse(ActionResult<ClientSettingsResponse> response, List<SupplierConfiguration> supplierConfigurations)
    {
        response.Should().BeOfType<ActionResult<ClientSettingsResponse>>().Which.Result.Should().BeOfType<OkObjectResult>();
        var okObjectResult = (OkObjectResult)response.Result;
        var clientSettings = (ClientSettingsResponse)okObjectResult.Value;
        clientSettings.SupplierConfigurations.Count.Should().Be(supplierConfigurations.Count);
        foreach (var supplierConfigResponse in clientSettings.SupplierConfigurations)
        {
            var supplierConfig = supplierConfigurations.Find(x => x.Supplier == supplierConfigResponse.Supplier);
            supplierConfig.Should().NotBeNull();
            supplierConfigResponse.Should().BeEquivalentTo(supplierConfig.Map());
        }
    }
}
