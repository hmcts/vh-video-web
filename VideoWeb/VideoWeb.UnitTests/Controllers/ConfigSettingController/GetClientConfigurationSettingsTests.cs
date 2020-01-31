using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using NUnit.Framework;
using VideoWeb.Common.Configuration;
using VideoWeb.Contract.Responses;
using VideoWeb.Controllers;

namespace VideoWeb.UnitTests.Controllers.ConfigSettingController
{
    public class GetClientConfigurationSettingsTests
    {
        [Test]
        public void Should_return_response_with_settings()
        {
            var securitySettings = new AzureAdConfiguration
            {
                ClientId = "ClientId",
                TenantId = "TenantId",
                ClientSecret = "ClientSecret",
                Authority = "Authority",
                ApplicationInsights = new ApplicationInsightsConfiguration {InstrumentationKey = "AiKey"}
            };

            var servicesConfiguration = new HearingServicesConfiguration
            {
                VideoApiUrl = "https://vh-video-api/"
            };

            var configSettingsController = new ConfigSettingsController(Options.Create(securitySettings),
                Options.Create(servicesConfiguration));

            var actionResult = (OkObjectResult)configSettingsController.GetClientConfigurationSettings().Result;
            var clientSettings = (ClientSettingsResponse)actionResult.Value;
            
            clientSettings.ClientId.Should().Be(securitySettings.ClientId);
            clientSettings.TenantId.Should().Be(securitySettings.TenantId);
            clientSettings.VideoApiUrl.Should().Be(servicesConfiguration.VideoApiUrl);
        }
    }
}