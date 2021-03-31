using System;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using VideoWeb.Common.Configuration;

namespace VideoWeb.AuthenticationSchemes
{
    public class VhAadScheme : ProviderSchemeBase, IProviderSchemes
    {
        private readonly AzureAdConfiguration _azureAdConfiguration;

        public VhAadScheme(AzureAdConfiguration azureAdConfiguration, string eventhubPath): base(eventhubPath)
        {
            _azureAdConfiguration = azureAdConfiguration;
        }

        public override AuthProvider Provider => AuthProvider.VHAAD;

        public bool BelongsToScheme(JwtSecurityToken jwtSecurityToken) => jwtSecurityToken.Issuer.Contains(_azureAdConfiguration.TenantId, StringComparison.InvariantCultureIgnoreCase);

        public override void SetJwtBearerOptions(JwtBearerOptions options)
        {
            options.Authority = $"{_azureAdConfiguration.Authority}{_azureAdConfiguration.TenantId}/v2.0";
            options.Audience = _azureAdConfiguration.ClientId;
            options.TokenValidationParameters.NameClaimType = "preferred_username";
            options.TokenValidationParameters.ClockSkew = TimeSpan.Zero;
        }
    }
}
