using System;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using VideoWeb.Common.Configuration;

namespace VideoWeb.AuthenticationSchemes
{
    public abstract class AadSchemeBase : ProviderSchemeBase, IProviderSchemes
    {
        private readonly IdpConfiguration _idpConfiguration;
        
        protected AadSchemeBase(string eventhubPath, IdpConfiguration idpConfiguration) : base(eventhubPath)
        {
            _idpConfiguration = idpConfiguration;
        }

        public bool BelongsToScheme(JwtSecurityToken jwtSecurityToken) => jwtSecurityToken.Issuer.Contains(_idpConfiguration.TenantId, StringComparison.InvariantCultureIgnoreCase);

        public override void SetJwtBearerOptions(JwtBearerOptions options)
        {
            options.Authority = $"{_idpConfiguration.Authority}{_idpConfiguration.TenantId}/v2.0";
            options.Audience = string.IsNullOrEmpty(_idpConfiguration.ResourceId) ? _idpConfiguration.ClientId :  _idpConfiguration.ResourceId;
            options.TokenValidationParameters.NameClaimType = "preferred_username";
            options.TokenValidationParameters.ClockSkew = TimeSpan.Zero;
            options.TokenValidationParameters.ValidateLifetime = true;
        }
    }
}
