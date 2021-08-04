using System;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using VideoWeb.Common.Configuration;

namespace VideoWeb.AuthenticationSchemes
{
    public class MagicLinksScheme : ProviderSchemeBase, IProviderSchemes
    {
        private readonly MagicLinksConfiguration _idpConfiguration;

        public MagicLinksScheme(MagicLinksConfiguration idpConfiguration, string eventhubPath) : base(eventhubPath)
        {
            _idpConfiguration = idpConfiguration;
        }
        
        public bool BelongsToScheme(JwtSecurityToken jwtSecurityToken) => jwtSecurityToken.Issuer.Contains(_idpConfiguration.Issuer, StringComparison.InvariantCultureIgnoreCase);

        public override void SetJwtBearerOptions(JwtBearerOptions options)
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateAudience = false,
                NameClaimType = "preferred_username",
                ValidateIssuer = true,
                ValidIssuer = _idpConfiguration.Issuer,
                ClockSkew = TimeSpan.Zero,
                IssuerSigningKey = new SymmetricSecurityKey(Convert.FromBase64String(_idpConfiguration.JwtProviderSecret))
            };
        }

        public override AuthProvider Provider => AuthProvider.MagicLinks;
    }
}
