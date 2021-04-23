using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using VideoWeb.Common.Configuration;

namespace VideoWeb.AuthenticationSchemes
{
    public class EJudiciaryScheme : AadSchemeBase
    {
        public EJudiciaryScheme(string eventhubPath, EJudAdConfiguration eJudAdConfiguration): base(eventhubPath, eJudAdConfiguration)
        {
        }

        public override AuthProvider Provider => AuthProvider.EJudiciary;
        
        public override void SetJwtBearerOptions(JwtBearerOptions options)
        {
            base.SetJwtBearerOptions(options);
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
