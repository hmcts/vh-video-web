using System.Collections.Generic;
using System.Security.Claims;

namespace VideoWeb.UnitTests.Builders
{
    public class ClaimsPrincipalBuilder
    {
        public static string Username = "john@doe.com";
        public ClaimsPrincipal Build()
        {
            var claims = new List<Claim>
            { 
                new Claim(ClaimTypes.Name, Username),
                new Claim(ClaimTypes.NameIdentifier, "userId"),
                new Claim("name", "John Doe")
            };
            var identity = new ClaimsIdentity(claims, "TestAuthType");
            var claimsPrincipal = new ClaimsPrincipal(identity);
            return claimsPrincipal;
        }
    }
}
