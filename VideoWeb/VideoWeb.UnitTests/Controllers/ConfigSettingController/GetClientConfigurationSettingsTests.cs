using Autofac.Extras.Moq;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using NUnit.Framework;
using VideoWeb.Common.Configuration;
using VideoWeb.Common.Security;
using VideoWeb.Common.Security.HashGen;
using VideoWeb.Contract.Responses;
using VideoWeb.Controllers;
using VideoWeb.Mappings;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.Controllers.ConfigSettingController
{
    public class GetClientConfigurationSettingsTests
    {
        private AutoMock _mocker;

        [SetUp]
        public void Setup()
        {
            _mocker = AutoMock.GetLoose();
            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<AzureAdConfiguration, EJudAdConfiguration, Dom1AdConfiguration, HearingServicesConfiguration, SupplierConfiguration, ClientSettingsResponse>())
                .Returns(_mocker.Create<ClientSettingsResponseMapper>());
            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<IdpConfiguration, IdpSettingsResponse>())
                .Returns(_mocker.Create<IdpSettingsResponseMapper>());
        }
        
        [Test]
        public void Should_return_response_with_settings()
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
            
            var kinlyConfiguration = new KinlyConfiguration
            {
                JoinByPhoneFromDate = "2021-02-09"
            };

            var supplierLocatorMock = _mocker.Mock<ISupplierLocator>()
                .Setup(x => x.GetSupplierConfiguration())
                .Returns(Options.Create(kinlyConfiguration));
            
            var parameters = new ParameterBuilder(_mocker).AddObject(Options.Create(securitySettings))
                .AddObject(Options.Create(servicesConfiguration))
                .AddObject(supplierLocatorMock)
                .AddObject(Options.Create(eJudAdConfiguration))
                .AddObject(Options.Create(dom1AdConfiguration))
                .Build();

            var configSettingsController = _mocker.Create<ConfigSettingsController>(parameters);
            
            var result = configSettingsController.GetClientConfigurationSettings();
            result.Should().BeOfType<ActionResult<ClientSettingsResponse>>().Which.Result.Should().BeOfType<OkObjectResult>();
            var okObjectResult = (OkObjectResult)result.Result;
            var clientSettings = (ClientSettingsResponse)okObjectResult.Value;
            clientSettings.JoinByPhoneFromDate.Should().Be(kinlyConfiguration.JoinByPhoneFromDate);
            clientSettings.EnableDynamicEvidenceSharing.Should().Be(servicesConfiguration.EnableDynamicEvidenceSharing);
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
            
            var supplierLocatorMock = _mocker.Mock<ISupplierLocator>()
                .Setup(x => x.GetSupplierConfiguration())
                .Returns(Options.Create(kinlyConfiguration));

            var parameters = new ParameterBuilder(_mocker).AddObject(Options.Create(securitySettings))
                .AddObject(Options.Create(servicesConfiguration))
                .AddObject(supplierLocatorMock)
                .Build();

            var configSettingsController = _mocker.Create<ConfigSettingsController>(parameters);

            var result = configSettingsController.GetClientConfigurationSettings();
            result.Should().BeOfType<ActionResult<ClientSettingsResponse>>().Which.Result.Should().BeOfType<BadRequestObjectResult>();
        }
    }
}
