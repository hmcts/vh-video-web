using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using VideoWeb.Common.Configuration;

namespace VideoWeb.AuthenticationSchemes
{
    public class EJudiciaryScheme : ProviderSchemeBase, IProviderSchemes
    {
        private readonly EJudAdConfiguration _eJudAdConfiguration;

        public EJudiciaryScheme(string eventhubPath, EJudAdConfiguration eJudAdConfiguration): base(eventhubPath)
        {
            _eJudAdConfiguration = eJudAdConfiguration;
        }

        public override AuthProvider Provider => AuthProvider.EJudiciary;

        public bool BelongsToScheme(JwtSecurityToken jwtSecurityToken) => jwtSecurityToken.Issuer.Contains(_eJudAdConfiguration.TenantId, StringComparison.InvariantCultureIgnoreCase);

        public override void SetJwtBearerOptions(JwtBearerOptions options)
        {
            options.Authority = $"https://login.microsoftonline.com/{_eJudAdConfiguration.TenantId}/v2.0";
            options.TokenValidationParameters.NameClaimType = "preferred_username";
            options.Audience = _eJudAdConfiguration.ClientId;
            options.TokenValidationParameters.ClockSkew = TimeSpan.Zero;
            options.Events = new JwtBearerEvents { OnTokenValidated = OnTokenValidated };
        }

        public Task OnTokenValidated(TokenValidatedContext context)
        {
            if (context.SecurityToken is JwtSecurityToken jwtToken)
            {
                // TODO: Make call to api to get the users roles and groups.
                // Cache result in distributed cache using the jwtToken.RawData as key.
                // Cache can expire the at the same time the token does.
                var claimsIdentity = context.Principal.Identity as ClaimsIdentity;
                claimsIdentity?.AddClaim(new Claim(claimsIdentity.RoleClaimType, "Judge"));
            }

            return Task.CompletedTask;
        }
    }
}
