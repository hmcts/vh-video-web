using FizzWare.NBuilder;
using FluentAssertions;
using NUnit.Framework;
using VideoWeb.Common.Configuration;
using VideoWeb.Mappings;

namespace VideoWeb.UnitTests.Mappings;

public class IdpSettingsResponseMapperTests
{
    [Test]
    public void should_map_ejud_config()
    {
        var ejudAdConfiguration = Builder<EJudAdConfiguration>.CreateNew().Build();
        
        var response = IdpSettingsResponseMapper.Map(ejudAdConfiguration);
        
        response.ClientId.Should().Be(ejudAdConfiguration.ClientId);
        response.TenantId.Should().Be(ejudAdConfiguration.TenantId);
        response.RedirectUri.Should().Be(ejudAdConfiguration.RedirectUri);
        response.PostLogoutRedirectUri.Should().Be(ejudAdConfiguration.PostLogoutRedirectUri);
        response.ResourceId.Should().Be(ejudAdConfiguration.ResourceId);
    }
    
    [Test]
    public void should_map_dom1_config()
    {
        var dom1AdConfiguration = Builder<Dom1AdConfiguration>.CreateNew().Build();
        
        var response = IdpSettingsResponseMapper.Map(dom1AdConfiguration);
        
        response.ClientId.Should().Be(dom1AdConfiguration.ClientId);
        response.TenantId.Should().Be(dom1AdConfiguration.TenantId);
        response.RedirectUri.Should().Be(dom1AdConfiguration.RedirectUri);
        response.PostLogoutRedirectUri.Should().Be(dom1AdConfiguration.PostLogoutRedirectUri);
        response.ResourceId.Should().Be(dom1AdConfiguration.ResourceId);
    }
    
    [Test]
    public void should_map_vh_config()
    {
        var azureAdConfiguration = Builder<AzureAdConfiguration>.CreateNew()
            .With(x => x.ApplicationInsights = Builder<ApplicationInsightsConfiguration>.CreateNew().Build())
            .Build();
        
        var response = IdpSettingsResponseMapper.Map(azureAdConfiguration);
        
        response.ClientId.Should().Be(azureAdConfiguration.ClientId);
        response.TenantId.Should().Be(azureAdConfiguration.TenantId);
        response.RedirectUri.Should().Be(azureAdConfiguration.RedirectUri);
        response.PostLogoutRedirectUri.Should().Be(azureAdConfiguration.PostLogoutRedirectUri);
        response.ResourceId.Should().Be(azureAdConfiguration.ResourceId);
    }
}
