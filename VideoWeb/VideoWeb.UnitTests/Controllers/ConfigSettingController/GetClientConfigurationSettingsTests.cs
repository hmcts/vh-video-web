using Autofac.Extras.Moq;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using NUnit.Framework;
using VideoWeb.Common.Configuration;
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
            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<AzureAdConfiguration, EJudAdConfiguration, HearingServicesConfiguration, KinlyConfiguration, ClientSettingsResponse>())
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
                ApplicationInsights = new ApplicationInsightsConfiguration { InstrumentationKey = "AiKey" }
            };
            
            var eJudAdConfiguration = new EJudAdConfiguration()
            {
                ClientId = "EjudClientId",
                TenantId = "EjudTenantId",
                Authority = "EjudAuthority",
                RedirectUri = "EjudRedirectUri",
                PostLogoutRedirectUri = "EjudPostLogoutRedirectUri"
            };

            var servicesConfiguration = new HearingServicesConfiguration
            {
                VideoApiUrl = "https://vh-video-api/"
            };

            var kinlyConfiguration = new KinlyConfiguration
            {
                JoinByPhoneFromDate = "2021-02-09"
            };

            var parameters = new ParameterBuilder(_mocker).AddObject(Options.Create(securitySettings))
                .AddObject(Options.Create(servicesConfiguration))
                .AddObject(kinlyConfiguration)
                .AddObject(Options.Create(eJudAdConfiguration))
                .Build();

            var configSettingsController = _mocker.Create<ConfigSettingsController>(parameters);

            var result = configSettingsController.GetClientConfigurationSettings();
            result.Should().BeOfType<ActionResult<ClientSettingsResponse>>().Which.Result.Should().BeOfType<OkObjectResult>();
            var okObjectResult = (OkObjectResult) result.Result;
            var clientSettings = (ClientSettingsResponse) okObjectResult.Value;
            clientSettings.JoinByPhoneFromDate.Should().Be(kinlyConfiguration.JoinByPhoneFromDate);
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
                ApplicationInsights = new ApplicationInsightsConfiguration { InstrumentationKey = "AiKey" }
            };

            var servicesConfiguration = new HearingServicesConfiguration
            {
                VideoApiUrl = "https://vh-video-api/"
            };

            var kinlyConfiguration = new KinlyConfiguration
            {
                JoinByPhoneFromDate = "2021-02-09"
            };

            var parameters = new ParameterBuilder(_mocker).AddObject(Options.Create(securitySettings))
                .AddObject(Options.Create(servicesConfiguration))
                .AddObject(kinlyConfiguration)
                .Build();

            var configSettingsController = _mocker.Create<ConfigSettingsController>(parameters);

            var result = configSettingsController.GetClientConfigurationSettings();
            result.Should().BeOfType<ActionResult<ClientSettingsResponse>>().Which.Result.Should().BeOfType<BadRequestObjectResult>();
        }
    }
}
