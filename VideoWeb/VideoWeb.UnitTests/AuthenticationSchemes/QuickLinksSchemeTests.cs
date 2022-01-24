using FluentAssertions;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using NUnit.Framework;
using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Cryptography;
using VideoWeb.AuthenticationSchemes;
using VideoWeb.Common.Configuration;

namespace VideoWeb.UnitTests.AuthenticationSchemes
{
    public class QuickLinksSchemeTest
    {
        private QuickLinksScheme _sut;
        private QuickLinksConfiguration _configuration;

        [SetUp]
        public void SetUp()
        {
            _configuration = new QuickLinksConfiguration
            {
                Issuer = "issuer",
                JwtProviderSecret = "x4p5Kxsygx3dYAso0JKZljK0PL926mxppc5gGqeV9aRydc++gSNx4UITuZ1G6YJX7KgymQnQiEsaG/XIUKTPPA=="
            };
            var services = new ServiceCollection();
            services.AddSingleton<RsaSecurityKey>(provider => {
                RSA rsa = RSA.Create();
                rsa.ImportRSAPublicKey(
                    source: Convert.FromBase64String("MEgCQQCw4Yu3CKpAGsoizccP4Yue2+onGQIB/x1lrvZSbF9T1gL3GXFw3XiAvKmhxYLlCH2BRHwullQ78csLhFOem5s1AgMBAAE="),
                    bytesRead: out int _
                );
                return new RsaSecurityKey(rsa);
            });

            _sut = new QuickLinksScheme(_configuration, "eventHubPath", services);
        }

        [Test]
        public void ShouldReturnCorrectProvider()
        {
            // Act
            var provider = _sut.Provider;

            // Assert
            provider.Should().Be(AuthProvider.QuickLinks);
        }

        [Test]
        public void ShouldSetSchemeNameToProvider()
        {
            // Act
            var schemeName = _sut.SchemeName;

            // Assert
            schemeName.Should().Be(AuthProvider.QuickLinks.ToString());
        }

        [Test]
        public void ShouldSetEventHubSchemeNameToProvider()
        {
            // Act
            var schemeName = _sut.EventHubSchemeName;

            // Assert
            schemeName.Should().Be($"EventHub{AuthProvider.QuickLinks}");
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
