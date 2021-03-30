using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace VideoWeb.AuthenticationSchemes
{
    public class EJudiciaryScheme : ProviderSchemeBase, IProviderSchemes
    {
        public EJudiciaryScheme(string eventhubPath): base(eventhubPath)
        {
        }

        public override AuthProvider Provider => AuthProvider.EJudiciary;

        public bool BelongsToScheme(JwtSecurityToken jwtSecurityToken) => jwtSecurityToken.Issuer.Contains("0b90379d-18de-426a-ae94-7f62441231e0", StringComparison.InvariantCultureIgnoreCase);

        protected override void SetJwtBearerOptions(JwtBearerOptions options)
        {
            options.Authority = "https://login.microsoftonline.com/0b90379d-18de-426a-ae94-7f62441231e0/v2.0";
            options.TokenValidationParameters.ValidateLifetime = true;
            options.TokenValidationParameters.NameClaimType = "preferred_username";
            options.Audience = "a6596b93-7bd6-4363-81a4-3e6d9aa2df2b";
            options.TokenValidationParameters.ClockSkew = TimeSpan.Zero;
            options.Events = new JwtBearerEvents { OnTokenValidated = OnTokenValidated };
        }

        private Task OnTokenValidated(TokenValidatedContext context)
        {
            if (context.SecurityToken is JwtSecurityToken jwtToken)
            {
                // TODO: Make call to api to get the users roles and groups.
                // Cache result in distributed cache using the jwtToken.RawData as key.
                var claimsIdentity = context.Principal.Identity as ClaimsIdentity;
                claimsIdentity?.AddClaim(new Claim(claimsIdentity.RoleClaimType, "Judge"));
            }

            return Task.CompletedTask;
        }
    }
}
