using FizzWare.NBuilder;
using FluentAssertions;
using NUnit.Framework;
using VideoWeb.Common.Configuration;
using VideoWeb.Mappings;

namespace VideoWeb.UnitTests.Mappings
{
    public class IdpSettingsResponseMapperTests : BaseMockerSutTestSetup<IdpSettingsResponseMapper>
    {
        [Test]
        public void should_map_ejud_config()
        {
            var ejudAdConfiguration = Builder<EJudAdConfiguration>.CreateNew().Build();
            
            var response = _sut.Map(ejudAdConfiguration);

            response.ClientId.Should().Be(ejudAdConfiguration.ClientId);
            response.TenantId.Should().Be(ejudAdConfiguration.TenantId);
            response.RedirectUri.Should().Be(ejudAdConfiguration.RedirectUri);
            response.PostLogoutRedirectUri.Should().Be(ejudAdConfiguration.PostLogoutRedirectUri);
        }

        [Test]
        public void should_map_vh_config()
        {
            var azureAdConfiguration = Builder<AzureAdConfiguration>.CreateNew()
                .With(x => x.ApplicationInsights = Builder<ApplicationInsightsConfiguration>.CreateNew().Build())
                .Build();
            
            var response = _sut.Map(azureAdConfiguration);
            
            response.ClientId.Should().Be(azureAdConfiguration.ClientId);
            response.TenantId.Should().Be(azureAdConfiguration.TenantId);
            response.RedirectUri.Should().Be(azureAdConfiguration.RedirectUri);
            response.PostLogoutRedirectUri.Should().Be(azureAdConfiguration.PostLogoutRedirectUri);
        }
    }
}
