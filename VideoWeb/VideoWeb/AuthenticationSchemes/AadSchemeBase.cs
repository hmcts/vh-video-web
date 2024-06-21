using System;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.JsonWebTokens;
using VideoWeb.Common;
using VideoWeb.Common.Configuration;
using VideoWeb.Common.Models;
using VideoWeb.Services;

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
            options.Audience = _idpConfiguration.ClientId;
            options.TokenValidationParameters.NameClaimType = "preferred_username";
            options.TokenValidationParameters.ClockSkew = TimeSpan.Zero;
            options.TokenValidationParameters.ValidateLifetime = true;
            options.Events = new JwtBearerEvents()
                {OnTokenValidated = context => GetClaimsPostTokenValidation(context, options)};
        }
        
        public virtual async Task GetClaimsPostTokenValidation(TokenValidatedContext context, JwtBearerOptions options)
        {
            if (context.SecurityToken is JwtSecurityToken jwtToken)
            {
                if (DoesNotNeedAdditionalClaims(context.Principal!))
                {
                    return;
                }

                var usernameClaim = jwtToken.Claims.First(x => x.Type == options.TokenValidationParameters.NameClaimType);
                var appRoleService = context.HttpContext.RequestServices.GetService(typeof(IAppRoleService)) as IAppRoleService;
                var claims = await appRoleService!.GetClaimsForUserAsync(usernameClaim.Value);
                context.Principal!.AddIdentity(new ClaimsIdentity(claims));
            }
            
            if (context.SecurityToken is JsonWebToken jsonWebToken)
            {
                if (DoesNotNeedAdditionalClaims(context.Principal!))
                {
                    return;
                }
                var usernameClaim = jsonWebToken.Claims.First(x => x.Type == options.TokenValidationParameters.NameClaimType);
                var appRoleService = context.HttpContext.RequestServices.GetService(typeof(IAppRoleService)) as IAppRoleService;
                var claims = await appRoleService!.GetClaimsForUserAsync(usernameClaim.Value);
                context.Principal!.AddIdentity(new ClaimsIdentity(claims));
            }
        }
        
        /// <summary>
        /// Not all users will need to query bookings api for additional claims
        /// </summary>
        /// <param name="principal"></param>
        /// <returns></returns>
        private static bool DoesNotNeedAdditionalClaims( ClaimsPrincipal principal)
        {
            return principal.IsInRole(AppRoles.CitizenRole) || principal.IsInRole(AppRoles.JudgeRole) ||
                   principal.IsInRole(AppRoles.RepresentativeRole) ||
                   principal.IsInRole(AppRoles.QuickLinkObserver) || principal.IsInRole(AppRoles.QuickLinkParticipant);
        }
    }
}
