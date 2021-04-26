using Autofac;
using Autofac.Extras.Moq;
using FluentAssertions;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http;
using NUnit.Framework;
using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Threading.Tasks;
using FizzWare.NBuilder;
using VideoWeb.AuthenticationSchemes;
using VideoWeb.Common.Configuration;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.AuthenticationSchemes
{
    public class EJudiciarySchemeTests
    {
        private EJudiciaryScheme sut;
        private EJudAdConfiguration _ejudConfig;


        [SetUp]
        public void SetUp()
        {
            _ejudConfig = new EJudAdConfiguration
            {
                Authority = "https://login.microsoftonline.com/",
                ClientId = "EjudClientId",
                RedirectUri = "https://localhost:5800/home",
                PostLogoutRedirectUri = "https://localhost:5800/logout",
                TenantId = "EjudTenant"
            };
            sut = new EJudiciaryScheme("eventHubPath", _ejudConfig);
        }

        [Test]
        public void ShouldReturnCorrectProvider()
        {
            // Act
            var provider = sut.Provider;

            // Assert
            provider.Should().Be(AuthProvider.EJudiciary);
        }

        [Test]
        public void ShouldSetSchemeNameToProvider()
        {
            // Act
            var schemeName = sut.SchemeName;

            // Assert
            schemeName.Should().Be(AuthProvider.EJudiciary.ToString());
        }

        [Test]
        public void ShouldSetEventHubSchemeNameToProvider()
        {
            // Act
            var schemeName = sut.EventHubSchemeName;

            // Assert
            schemeName.Should().Be($"EventHub{AuthProvider.EJudiciary}");
        }

        [Test]
        public void ShouldGetCorrectScheme()
        {
            // Act
            var scheme = (sut as IProviderSchemes).GetScheme(false);
            var eventHubScheme = (sut as IProviderSchemes).GetScheme(true);

            // Assert
            scheme.Should().Be(sut.SchemeName);
            eventHubScheme.Should().Be(sut.EventHubSchemeName);
        }

        [Test]
        public void ShouldSetSchemeOptions()
        {
            // Arrange
            var jwtBearerOptions = new JwtBearerOptions();

            // Act
            sut.SetJwtBearerOptions(jwtBearerOptions);

            // Assert
            jwtBearerOptions.Authority.Should().Be($"{_ejudConfig.Authority}{_ejudConfig.TenantId}/v2.0");
            jwtBearerOptions.Audience.Should().Be(_ejudConfig.ClientId);
            jwtBearerOptions.TokenValidationParameters.NameClaimType.Should().Be("preferred_username");
            jwtBearerOptions.TokenValidationParameters.ValidateLifetime.Should().BeTrue();
            jwtBearerOptions.TokenValidationParameters.ClockSkew.Should().Be(TimeSpan.Zero);
        }

        [Test]
        public void ShouldReturnFalseIfDoesntBelongsToScheme()
        {
            // Arange
            var token = new JwtSecurityToken(issuer: "Issuer");

            // Act
            var belongs = sut.BelongsToScheme(token);

            // Assert
            belongs.Should().BeFalse();
        }

        [Test]
        public void ShouldReturnTrueIfDoesntBelongsToScheme()
        {
            // Arange
            var token = new JwtSecurityToken(issuer: _ejudConfig.TenantId);

            // Act
            var belongs = sut.BelongsToScheme(token);

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
            sut.SetJwtBearerOptions(options);
            var tokenValidatedContext = new TokenValidatedContext(httpContext, new AuthenticationScheme("name", "displayName", typeof(AuthenticationHandler<JwtBearerOptions>)), options)
            {
                Principal = claimsPrincipal,
                SecurityToken = new JwtSecurityToken(issuer: "Issuer")
            };

            // Act
            await sut.OnTokenValidated(tokenValidatedContext);

            // Assert
            var identity = tokenValidatedContext.Principal.Identity.Should().BeOfType<ClaimsIdentity>().Which;
            identity.FindFirst(identity.RoleClaimType).Value.Should().Be("Judge");
        }
    }
}
