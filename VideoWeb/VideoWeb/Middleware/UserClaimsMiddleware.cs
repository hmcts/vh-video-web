using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using VideoWeb.Services;

namespace VideoWeb.Middleware
{
    public class UserClaimsMiddleware
    {
        public const string OidClaimType = "http://schemas.microsoft.com/identity/claims/objectidentifier";
        private readonly RequestDelegate _next;

        public UserClaimsMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext httpContext)
        {
            if (httpContext.User.Identity is {IsAuthenticated: true})
            {
                var appRoleService = httpContext.RequestServices.GetService(typeof(IAppRoleService)) as IAppRoleService;
                //Get user's immutable object id from claims that came from Azure AD
                var oid = httpContext.User.FindFirstValue(OidClaimType);
                
                var claims = await appRoleService!.GetClaimsForUserAsync(oid, httpContext.User.Identity.Name);
                httpContext.User.AddIdentity(new ClaimsIdentity(claims));
            }
            await _next(httpContext);
        }
    }
}
