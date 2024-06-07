using Autofac;
using Autofac.Extras.Moq;
using FluentAssertions;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http;
using NUnit.Framework;
using System;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.IdentityModel.JsonWebTokens;
using VideoWeb.AuthenticationSchemes;
using VideoWeb.Common.Configuration;
using VideoWeb.Common;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.AuthenticationSchemes
{
    public class EJudiciarySchemeTests
    {
        private AutoMock _mocker;
        private EJudiciaryScheme sut;
        private EJudAdConfiguration _ejudConfig;


        [SetUp]
        public void SetUp()
        {
            _mocker = AutoMock.GetLoose();
            _mocker.Mock<IServiceProvider>()
                .Setup(x => x.GetService(typeof(IAppRoleService)))
                .Returns(_mocker.Mock<IAppRoleService>().Object);
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
        public async Task ShouldAddClaimsOnTokenValidation_WhenSecurityTokenIs_JwtSecurityToken()
        {
            // Arrange
            var claimsPrincipal = new EjudClaimsPrincipalBuilder().Build();
            var httpContext = new DefaultHttpContext
            {
                User = claimsPrincipal,
                RequestServices = _mocker.Mock<IServiceProvider>().Object
            };

            var options = new JwtBearerOptions();
            sut.SetJwtBearerOptions(options);
            var tokenValidatedContext = new TokenValidatedContext(httpContext, new AuthenticationScheme("name", "displayName", typeof(AuthenticationHandler<JwtBearerOptions>)), options)
            {
                Principal = claimsPrincipal,
                SecurityToken = new JwtSecurityToken(issuer: "Issuer", claims: claimsPrincipal.Claims)
            };

            // Act
            await sut.GetClaimsPostTokenValidation(tokenValidatedContext, new JwtBearerOptions());

            // Assert
            var identity = tokenValidatedContext.Principal.Identity.Should().BeOfType<ClaimsIdentity>().Which;
            var roleClaims = identity.Claims.Where(c => c.Type == identity.RoleClaimType).ToList();
            roleClaims.Should().Contain(c => c.Value == "Judge");
            roleClaims.Should().Contain(c => c.Value == "JudicialOfficeHolder");
        }
        
        [Test]
        public async Task ShouldAddClaimsOnTokenValidation_WhenSecurityTokenIs_JsonWebToken()
        {
            // Arrange
            var claimsPrincipal = new EjudClaimsPrincipalBuilder().Build();
            var httpContext = new DefaultHttpContext
            {
                User = claimsPrincipal,
                RequestServices = _mocker.Mock<IServiceProvider>().Object
            };
            
            var options = new JwtBearerOptions();
            sut.SetJwtBearerOptions(options);
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
            
            // Act
            await sut.GetClaimsPostTokenValidation(tokenValidatedContext, new JwtBearerOptions());
            
            // Assert
            var identity = tokenValidatedContext.Principal.Identity.Should().BeOfType<ClaimsIdentity>().Which;
            var roleClaims = identity.Claims.Where(c => c.Type == identity.RoleClaimType).ToList();
            roleClaims.Should().Contain(c => c.Value == "Judge");
            roleClaims.Should().Contain(c => c.Value == "JudicialOfficeHolder");
        }
    }
}
