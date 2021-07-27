using System;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using Microsoft.IdentityModel.Tokens;
using VideoWeb.Common.Configuration;

namespace VideoWeb.AuthenticationSchemes
{
    public class MagicLinksScheme : ProviderSchemeBase, IProviderSchemes
    {
        private readonly MagicLinksConfiguration _idpConfiguration;

        public MagicLinksScheme(IdpConfiguration idpConfiguration, string eventhubPath) : base(eventhubPath)
        {
            _idpConfiguration = idpConfiguration as MagicLinksConfiguration;
        }
        
        public bool BelongsToScheme(JwtSecurityToken jwtSecurityToken) => jwtSecurityToken.Issuer.Contains(_idpConfiguration.TenantId, StringComparison.InvariantCultureIgnoreCase);

        public override void SetJwtBearerOptions(JwtBearerOptions options)
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = false,
                ValidateAudience = false,
                NameClaimType = "preferred_username",
                IssuerSigningKey = new SymmetricSecurityKey(Convert.FromBase64String(_idpConfiguration.JwtProviderSecret))
            };
        }

        public override AuthProvider Provider => AuthProvider.MagicLinks;
    }
}
