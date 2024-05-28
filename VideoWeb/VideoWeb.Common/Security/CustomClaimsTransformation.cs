using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authentication;

namespace VideoWeb.Common.Security
{
    public class CustomClaimsTransformation : IClaimsTransformation
    {
        public Task<ClaimsPrincipal> TransformAsync(ClaimsPrincipal principal)
        {
            var identity = (ClaimsIdentity)principal.Identity;
 
            // Rename the claim to a fixed name, to protect against changes in framework updates
            RenameClaim("name", ClaimTypes.Name);
            
            return Task.FromResult(principal);
            
            void RenameClaim(string oldName, string newName)
            {
                var claim = identity.FindFirst(oldName);
                if (claim == null) return;
                
                identity.RemoveClaim(claim);
                identity.AddClaim(new Claim(newName, claim.Value));
            }
        }
    }
}
