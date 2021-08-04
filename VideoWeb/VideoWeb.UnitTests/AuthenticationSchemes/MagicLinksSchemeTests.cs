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
    public class MagicLinksSchemeTest
    {
        private MagicLinksScheme _sut;
        private MagicLinksConfiguration _configuration;

        [SetUp]
        public void SetUp()
        {
            _configuration = new MagicLinksConfiguration
            {
                Issuer = "issuer",
                JwtProviderSecret = "x4p5Kxsygx3dYAso0JKZljK0PL926mxppc5gGqeV9aRydc++gSNx4UITuZ1G6YJX7KgymQnQiEsaG/XIUKTPPA=="
            };
            _sut = new MagicLinksScheme(_configuration, "eventHubPath");
        }

        [Test]
        public void ShouldReturnCorrectProvider()
        {
            // Act
            var provider = _sut.Provider;

            // Assert
            provider.Should().Be(AuthProvider.MagicLinks);
        }

        [Test]
        public void ShouldSetSchemeNameToProvider()
        {
            // Act
            var schemeName = _sut.SchemeName;

            // Assert
            schemeName.Should().Be(AuthProvider.MagicLinks.ToString());
        }

        [Test]
        public void ShouldSetEventHubSchemeNameToProvider()
        {
            // Act
            var schemeName = _sut.EventHubSchemeName;

            // Assert
            schemeName.Should().Be($"EventHub{AuthProvider.MagicLinks}");
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
            jwtBearerOptions.TokenValidationParameters.ValidIssuer.Should().Be($"{_configuration.Issuer}");
            jwtBearerOptions.TokenValidationParameters.NameClaimType.Should().Be("preferred_username");
            jwtBearerOptions.TokenValidationParameters.ValidateLifetime.Should().BeTrue();
            jwtBearerOptions.TokenValidationParameters.ValidateIssuer.Should().BeTrue();
            jwtBearerOptions.TokenValidationParameters.ValidateAudience.Should().BeFalse();
            jwtBearerOptions.TokenValidationParameters.ClockSkew.Should().Be(TimeSpan.Zero);
        }

        [Test]
        public void ShouldReturnTrueIfDoesntBelongsToScheme()
        {
            // Arrange
            var token = new JwtSecurityToken(issuer: _configuration.Issuer);

            // Act
            var belongs = _sut.BelongsToScheme(token);

            // Assert
            belongs.Should().BeTrue();
        }
    }
}
