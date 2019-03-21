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
        public void should_return_response_with_settings()
        {
            var securitySettings = new AzureAdConfiguration
            {
                ClientId = "ClientId", 
                TenantId = "TenantId",
                ClientSecret = "ClientSecret",
                Authority = "Authority",
            };

            var configSettingsController = new ConfigSettingsController(Options.Create(securitySettings));

            var actionResult = (OkObjectResult)configSettingsController.GetClientConfigurationSettings().Result;
            var clientSettings = (ClientSettingsResponse)actionResult.Value;
            
            clientSettings.ClientId.Should().Be(securitySettings.ClientId);
            clientSettings.TenantId.Should().Be(securitySettings.TenantId);
        }
    }
}