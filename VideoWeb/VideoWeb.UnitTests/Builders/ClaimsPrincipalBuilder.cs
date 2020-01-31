using System.Collections.Generic;
using System.Security.Claims;

namespace VideoWeb.UnitTests.Builders
{
    public class ClaimsPrincipalBuilder
    {
        public ClaimsPrincipal Build()
        {
            var claims = new List<Claim>
            { 
                new Claim(ClaimTypes.Name, "john@doe.com"),
                new Claim(ClaimTypes.NameIdentifier, "userId"),
                new Claim("name", "John Doe")
            };
            var identity = new ClaimsIdentity(claims, "TestAuthType");
            var claimsPrincipal = new ClaimsPrincipal(identity);
            return claimsPrincipal;
        }
    }
}