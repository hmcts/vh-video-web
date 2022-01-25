using System;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using VideoWeb.Common.Configuration;

namespace VideoWeb.AuthenticationSchemes
{
    public class QuickLinksScheme : ProviderSchemeBase, IProviderSchemes
    {
        private readonly QuickLinksConfiguration _idpConfiguration;
        private readonly IServiceCollection _service;

        public QuickLinksScheme(QuickLinksConfiguration idpConfiguration, string eventhubPath, IServiceCollection service) : base(eventhubPath)
        {
            _idpConfiguration = idpConfiguration;
            _service = service;
        }

        public bool BelongsToScheme(JwtSecurityToken jwtSecurityToken) => jwtSecurityToken.Issuer.Contains(_idpConfiguration.Issuer, StringComparison.InvariantCultureIgnoreCase);

        public override void SetJwtBearerOptions(JwtBearerOptions options)
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidAudience = _idpConfiguration.ValidAudience,
                NameClaimType = "preferred_username",
                ValidateIssuer = true,
                ValidIssuer = _idpConfiguration.Issuer,
                ClockSkew = TimeSpan.Zero,
                IssuerSigningKey = _service.BuildServiceProvider().GetRequiredService<RsaSecurityKey>()
            };
        }

        public override AuthProvider Provider => AuthProvider.QuickLinks;
    }
}
