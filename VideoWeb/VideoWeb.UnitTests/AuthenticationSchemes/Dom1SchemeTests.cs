using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http;
using NUnit.Framework;
using VideoWeb.AuthenticationSchemes;
using VideoWeb.Common.Configuration;
using VideoWeb.Common.Models;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.AuthenticationSchemes;

public class Dom1SchemeTests
{
    private Dom1Scheme _sut;
    private Dom1AdConfiguration _dom1Config;

    [SetUp]
    public void Setup()
    {
        _dom1Config = new Dom1AdConfiguration()
        {
            Authority = "https://login.microsoftonline.com/",
            ClientId = "Dom1ClientId",
            RedirectUri = "https://localhost:5800/home",
            PostLogoutRedirectUri = "https://localhost:5800/logout",
            TenantId = "Dom1Tenant"
        };
        _sut = new Dom1Scheme("eventHubPath", _dom1Config);
    }
        
    [Test]
    public void ShouldReturnCorrectProvider()
    {
        // Act
        var provider = _sut.Provider;

        // Assert
        provider.Should().Be(AuthProvider.Dom1);
    }

    [Test]
    public void ShouldSetSchemeNameToProvider()
    {
        // Act
        var schemeName = _sut.SchemeName;

        // Assert
        schemeName.Should().Be(AuthProvider.Dom1.ToString());
    }

    [Test]
    public void ShouldSetEventHubSchemeNameToProvider()
    {
        // Act
        var schemeName = _sut.EventHubSchemeName;

        // Assert
        schemeName.Should().Be($"EventHub{AuthProvider.Dom1}");
    }

    [Test]
    public void ShouldGetCorrectScheme()
    {
        // Act
        var scheme = (_sut as IProviderSchemes).GetScheme(false);
        var eventHubScheme = (_sut as IProviderSchemes).GetScheme(true);

        // Assert
        scheme.Should().Be(_sut.SchemeName);
        eventHubScheme.Should().Be(_sut.EventHubSchemeName);
    }

    [Test]
    public void ShouldSetSchemeOptions()
    {
        // Arrange
        var jwtBearerOptions = new JwtBearerOptions();

        // Act
        _sut.SetJwtBearerOptions(jwtBearerOptions);

        // Assert
        jwtBearerOptions.Authority.Should().Be($"{_dom1Config.Authority}{_dom1Config.TenantId}/v2.0");
        jwtBearerOptions.Audience.Should().Be(_dom1Config.ClientId);
        jwtBearerOptions.TokenValidationParameters.NameClaimType.Should().Be("preferred_username");
        jwtBearerOptions.TokenValidationParameters.ValidateLifetime.Should().BeTrue();
        jwtBearerOptions.TokenValidationParameters.ClockSkew.Should().Be(TimeSpan.Zero);
    }

    [Test]
    public void ShouldReturnFalseIfDoesntBelongsToScheme()
    {
        // Arrange
        var token = new JwtSecurityToken(issuer: "Issuer");

        // Act
        var belongs = _sut.BelongsToScheme(token);

        // Assert
        belongs.Should().BeFalse();
    }

    [Test]
    public void ShouldReturnTrueIfDoesntBelongsToScheme()
    {
        // Arrange
        var token = new JwtSecurityToken(issuer: _dom1Config.TenantId);

        // Act
        var belongs = _sut.BelongsToScheme(token);

        // Assert
        belongs.Should().BeTrue();
    }

    [Test]
    public async Task ShouldAddClaimsOnTokenValidation()
    {
        // Arrange
        var claimsPrincipal = new ClaimsPrincipalBuilder().Build();
        var httpContext = new DefaultHttpContext
        {
            User = claimsPrincipal
        };

        var options = new JwtBearerOptions();
        _sut.SetJwtBearerOptions(options);
        var tokenValidatedContext = new TokenValidatedContext(httpContext, new AuthenticationScheme("name", "displayName", typeof(AuthenticationHandler<JwtBearerOptions>)), options)
        {
            Principal = claimsPrincipal,
            SecurityToken = new JwtSecurityToken(issuer: "Issuer")
        };

        // Act
        await _sut.OnTokenValidated(tokenValidatedContext);

        // Assert
        var identity = tokenValidatedContext.Principal.Identity.Should().BeOfType<ClaimsIdentity>().Which;
        identity.FindFirst(identity.RoleClaimType).Value.Should().Be(AppRoles.VhOfficerRole);
    }
}
