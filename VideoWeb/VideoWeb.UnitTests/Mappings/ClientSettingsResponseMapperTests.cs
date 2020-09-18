using FizzWare.NBuilder;
using FluentAssertions;
using NUnit.Framework;
using VideoWeb.Common.Configuration;
using VideoWeb.Mappings;

namespace VideoWeb.UnitTests.Mappings
{
    public class ClientSettingsResponseMapperTests
    {
        [Test]
        public void Should_map_all_properties()
        {
            var azureAdConfiguration = Builder<AzureAdConfiguration>.CreateNew()
                .With(x => x.ApplicationInsights = Builder<ApplicationInsightsConfiguration>.CreateNew().Build())
                .Build();
            
            var servicesConfiguration = Builder<HearingServicesConfiguration>.CreateNew().Build();

            var response = ClientSettingsResponseMapper.MapAppConfigurationToResponseModel(azureAdConfiguration, servicesConfiguration);

            response.TenantId.Should().Be(azureAdConfiguration.TenantId);
            response.ClientId.Should().Be(azureAdConfiguration.ClientId);
            response.RedirectUri.Should().Be(azureAdConfiguration.RedirectUri);
            response.PostLogoutRedirectUri.Should().Be(azureAdConfiguration.PostLogoutRedirectUri);
            response.VideoApiUrl.Should().Be(servicesConfiguration.VideoApiUrl);
            response.AppInsightsInstrumentationKey.Should().Be(azureAdConfiguration.ApplicationInsights.InstrumentationKey);
            response.EventHubPath.Should().Be(servicesConfiguration.EventHubPath);
        }
    }
}
