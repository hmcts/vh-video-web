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
            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<AzureAdConfiguration, HearingServicesConfiguration, KinlyConfiguration, ClientSettingsResponse>())
                .Returns(_mocker.Create<ClientSettingsResponseMapper>());
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
                .AddObject(kinlyConfiguration).Build();

            var configSettingsController = _mocker.Create<ConfigSettingsController>(parameters);

            var actionResult = (OkObjectResult)configSettingsController.GetClientConfigurationSettings().Result;
            var clientSettings = (ClientSettingsResponse)actionResult.Value;

            clientSettings.ClientId.Should().Be(securitySettings.ClientId);
            clientSettings.TenantId.Should().Be(securitySettings.TenantId);
            clientSettings.VideoApiUrl.Should().Be(servicesConfiguration.VideoApiUrl);
            clientSettings.JoinByPhoneFromDate.Should().Be(kinlyConfiguration.JoinByPhoneFromDate);
        }
    }
}
