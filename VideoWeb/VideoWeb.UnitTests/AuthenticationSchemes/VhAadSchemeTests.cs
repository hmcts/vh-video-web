using Autofac;
using Autofac.Extras.Moq;
using FluentAssertions;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using NUnit.Framework;
using System;
using System.IdentityModel.Tokens.Jwt;
using VideoWeb.AuthenticationSchemes;
using VideoWeb.Common.Configuration;

namespace VideoWeb.UnitTests.AuthenticationSchemes
{
    public class VhAadSchemeTests
    {
        private VhAadScheme sut;

        private AzureAdConfiguration configuration;

        [SetUp]
        public void SetUp()
        {
            configuration = new AzureAdConfiguration
            {
                TenantId = "tenantId",
                Authority = "authority",
                ClientId = "clientId"                
            };
            sut = new VhAadScheme(configuration, "eventHubPath");
        }

        [Test]
        public void ShouldReturnCorrectProvider()
        {
            // Act
            var provider = sut.Provider;

            // Assert
            provider.Should().Be(AuthProvider.VHAAD);
        }

        [Test]
        public void ShouldSetSchemeNameToProvider()
        {
            // Act
            var schemeName = sut.SchemeName;

            // Assert
            schemeName.Should().Be(AuthProvider.VHAAD.ToString());
        }

        [Test]
        public void ShouldSetEventHubSchemeNameToProvider()
        {
            // Act
            var schemeName = sut.EventHubSchemeName;

            // Assert
            schemeName.Should().Be($"EventHub{AuthProvider.VHAAD}");
        }

        [Test]
        public void ShouldSetSchemeOptions()
        {
            // Arrange
            var jwtBearerOptions = new JwtBearerOptions();

            // Act
            sut.SetJwtBearerOptions(jwtBearerOptions);

            // Assert
            jwtBearerOptions.Authority.Should().Be($"{configuration.Authority}{configuration.TenantId}/v2.0");
            jwtBearerOptions.Audience.Should().Be(configuration.ClientId);
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
            var token = new JwtSecurityToken(issuer: configuration.TenantId.ToUpper());

            // Act
            var belongs = sut.BelongsToScheme(token);

            // Assert
            belongs.Should().BeTrue();
        }
    }
}
