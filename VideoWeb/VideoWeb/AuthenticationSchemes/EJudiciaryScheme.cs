using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.JsonWebTokens;
using VideoWeb.Common.Configuration;

namespace VideoWeb.AuthenticationSchemes
{
    public class EJudiciaryScheme(string eventhubPath, EJudAdConfiguration eJudAdConfiguration)
        : AadSchemeBase(eventhubPath, eJudAdConfiguration)
    {
        public override AuthProvider Provider => AuthProvider.EJudiciary;

        public override Task GetClaimsPostTokenValidation(TokenValidatedContext context, JwtBearerOptions options)
        {
            if (context.SecurityToken is JwtSecurityToken or JsonWebToken)
            {
                // TODO: Make call to api to get the users roles and groups.
                // Cache result in distributed cache using the jwtToken.RawData as key.
                // Cache can expire the at the same time the token does.
                var claimsIdentity = context.Principal.Identity as ClaimsIdentity;
                claimsIdentity?.AddClaim(new Claim(claimsIdentity.RoleClaimType, "Judge"));
                claimsIdentity?.AddClaim(new Claim(claimsIdentity.RoleClaimType, "JudicialOfficeHolder"));
            }

            return Task.CompletedTask;
        }
    }
}
