using FizzWare.NBuilder;
using FluentAssertions;
using NUnit.Framework;
using VideoWeb.Common.Configuration;
using VideoWeb.Mappings;

namespace VideoWeb.UnitTests.Mappings
{
    public class ClientSettingsResponseMapperTests
    {
        private readonly ClientSettingsResponseMapper _mapper = new ClientSettingsResponseMapper();

        [Test]
        public void should_map_all_properties()
        {
            var azureAdConfiguration = Builder<AzureAdConfiguration>.CreateNew().Build();
            var servicesConfiguration = Builder<HearingServicesConfiguration>.CreateNew().Build();

            var response = _mapper.MapAppConfigurationToResponseModel(azureAdConfiguration, servicesConfiguration);

            response.TenantId.Should().Be(azureAdConfiguration.TenantId);
            response.ClientId.Should().Be(azureAdConfiguration.ClientId);
            response.RedirectUri.Should().Be(azureAdConfiguration.RedirectUri);
            response.PostLogoutRedirectUri.Should().Be(azureAdConfiguration.PostLogoutRedirectUri);
            response.VideoApiUrl.Should().Be(servicesConfiguration.VideoApiUrl);

        }
    }
}