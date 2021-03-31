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
using VideoWeb.AuthenticationSchemes;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.AuthenticationSchemes
{
    public class EJudiciarySchemeTests
    {
        private EJudiciaryScheme sut;

        [SetUp]
        public void SetUp()
        {
            sut = new EJudiciaryScheme("eventHubPath");
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
        public void ShouldSetSchemeOptions()
        {
            // Arrange
            var jwtBearerOptions = new JwtBearerOptions();

            // Act
            sut.SetJwtBearerOptions(jwtBearerOptions);

            // Assert
            jwtBearerOptions.Authority.Should().Be("https://login.microsoftonline.com/0b90379d-18de-426a-ae94-7f62441231e0/v2.0");
            jwtBearerOptions.Audience.Should().Be("a6596b93-7bd6-4363-81a4-3e6d9aa2df2b");
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
            var token = new JwtSecurityToken(issuer: "0b90379d-18de-426a-ae94-7f62441231e0");

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
