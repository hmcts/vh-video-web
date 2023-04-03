using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using VideoWeb.Common.Configuration;
using VideoWeb.Common.Models;

namespace VideoWeb.AuthenticationSchemes
{
    public class Dom1Scheme : AadSchemeBase
    {
        public Dom1Scheme(string eventhubPath, IdpConfiguration idpConfiguration) : base(eventhubPath, idpConfiguration)
        {
        }

        public override AuthProvider Provider => AuthProvider.Dom1;
        
        // Is everyone logging in with Dom1 a VHO? need to add the role to the token
        
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
                claimsIdentity?.AddClaim(new Claim(claimsIdentity.RoleClaimType, AppRoles.VhOfficerRole));
            }

            return Task.CompletedTask;
        }
    }
}
