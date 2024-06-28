using Autofac.Extras.Moq;
using FluentAssertions;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Moq;
using NUnit.Framework;
using System;
using System.IdentityModel.Tokens.Jwt;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.IdentityModel.JsonWebTokens;
using VideoWeb.AuthenticationSchemes;
using VideoWeb.Common;
using VideoWeb.Common.Configuration;
using VideoWeb.Common.Models;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.AuthenticationSchemes
{
    public class VhAadSchemeTests
    {
        private VhAadScheme _sut;
        private AzureAdConfiguration _configuration;
        private AutoMock _mocker;

        [SetUp]
        public void SetUp()
        {
            _configuration = new AzureAdConfiguration
            {
                TenantId = "tenantId",
                Authority = "authority",
                ClientId = "clientId"                
            };
            _sut = new VhAadScheme(_configuration, "eventHubPath");
            _mocker = AutoMock.GetLoose();
            _mocker.Mock<IServiceProvider>()
                .Setup(x => x.GetService(typeof(IAppRoleService)))
                .Returns(_mocker.Mock<IAppRoleService>().Object);
        }

        [Test]
        public void ShouldReturnCorrectProvider()
        {
            // Act
            var provider = _sut.Provider;

            // Assert
            provider.Should().Be(AuthProvider.VHAAD);
        }

        [Test]
        public void ShouldSetSchemeNameToProvider()
        {
            // Act
            var schemeName = _sut.SchemeName;

            // Assert
            schemeName.Should().Be(AuthProvider.VHAAD.ToString());
        }

        [Test]
        public void ShouldSetEventHubSchemeNameToProvider()
        {
            // Act
            var schemeName = _sut.EventHubSchemeName;

            // Assert
            schemeName.Should().Be($"EventHub{AuthProvider.VHAAD}");
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
            jwtBearerOptions.Authority.Should().Be($"{_configuration.Authority}{_configuration.TenantId}/v2.0");
            jwtBearerOptions.Audience.Should().Be(_configuration.ClientId);
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
            var belongs = _sut.BelongsToScheme(token);

            // Assert
            belongs.Should().BeFalse();
        }

        [Test]
        public void ShouldReturnTrueIfDoesntBelongsToScheme()
        {
            // Arange
            var token = new JwtSecurityToken(issuer: _configuration.TenantId.ToUpper());

            // Act
            var belongs = _sut.BelongsToScheme(token);

            // Assert
            belongs.Should().BeTrue();
        }

        [TestCase(AppRoles.CitizenRole)]
        [TestCase(AppRoles.JudgeRole)]
        [TestCase(AppRoles.RepresentativeRole)]
        [TestCase(AppRoles.QuickLinkObserver)]
        [TestCase(AppRoles.QuickLinkParticipant)]
        public async Task ShouldNotFetchClaimsFromAppRoleService_WhenSecurityContextIs_JwtSecurityToken_And_User_IsCivilian(string role)
        {
            // arrange
            var claimsPrincipal = new ClaimsPrincipalBuilder().WithRole(role).Build();
            var userClaimsPrincipal = new ClaimsPrincipalBuilder().Build();
            var httpContext = new DefaultHttpContext()
            {
                User = userClaimsPrincipal,
                RequestServices = _mocker.Mock<IServiceProvider>().Object
            };
            var options = new JwtBearerOptions();
            _sut.SetJwtBearerOptions(options);
            var tokenValidatedContext = new TokenValidatedContext(httpContext, new AuthenticationScheme("name", "displayName", typeof(AuthenticationHandler<JwtBearerOptions>)), options)
            {
                Principal = claimsPrincipal,
                SecurityToken = new JwtSecurityToken(issuer: "Issuer", claims: claimsPrincipal.Claims)
            };

            // act
            await _sut.GetClaimsPostTokenValidation(tokenValidatedContext, options);
            
            // assert
            _mocker.Mock<IAppRoleService>().Verify(x => x.GetClaimsForUserAsync(It.IsAny<string>()), Times.Never);
        }

        [TestCase(AppRoles.CitizenRole)]
        [TestCase(AppRoles.JudgeRole)]
        [TestCase(AppRoles.RepresentativeRole)]
        [TestCase(AppRoles.QuickLinkObserver)]
        [TestCase(AppRoles.QuickLinkParticipant)]
        public async Task ShouldNotFetchClaimsFromAppRoleService_WhenSecurityContextIs_JsonWebToken_And_User_IsCivilian(string role)
        {
            // arrange
            var claimsPrincipal = new ClaimsPrincipalBuilder().WithRole(role).Build();
            var userClaimsPrincipal = new ClaimsPrincipalBuilder().Build();
            var httpContext = new DefaultHttpContext()
            {
                User = userClaimsPrincipal,
                RequestServices = _mocker.Mock<IServiceProvider>().Object
            };
            var options = new JwtBearerOptions();
            _sut.SetJwtBearerOptions(options);
            var jwtSecurityToken = new JwtSecurityToken(issuer: "Issuer", claims: claimsPrincipal.Claims);
            // convert to JsonWebToken
            var handler = new JwtSecurityTokenHandler();
            // Write the JwtSecurityToken to a string
            var jwtString = handler.WriteToken(jwtSecurityToken);

            // Create a new JsonWebToken from the string
            var jsonWebToken = new JsonWebToken(jwtString);
            var tokenValidatedContext = new TokenValidatedContext(httpContext, new AuthenticationScheme("name", "displayName", typeof(AuthenticationHandler<JwtBearerOptions>)), options)
            {
                Principal = claimsPrincipal,
                SecurityToken = jsonWebToken
            };

            // act
            await _sut.GetClaimsPostTokenValidation(tokenValidatedContext, options);

            // assert
            _mocker.Mock<IAppRoleService>().Verify(x => x.GetClaimsForUserAsync(It.IsAny<string>()), Times.Never);
        }
    }
}
