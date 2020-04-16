using System.Collections.Generic;
using System.Security.Claims;
using VideoWeb.Common.Extensions;
using VideoWeb.Common.Models;

namespace VideoWeb.UnitTests.Builders
{
    public class ClaimsPrincipalBuilder
    {
        public static string Username = "john@doe.com";

        private readonly List<Claim> _claims;
        public ClaimsPrincipalBuilder()
        {
            _claims = new List<Claim>
            { 
                new Claim(ClaimTypes.Name, Username),
                new Claim(ClaimTypes.NameIdentifier, "userId"),
                new Claim("name", "John Doe")
            };
        }

        public ClaimsPrincipalBuilder WithRole(Role role)
        {
            _claims.Add(new Claim(ClaimTypes.Role, role.EnumDataMemberAttr()));
            return this;
        }
        
        public ClaimsPrincipalBuilder WithClaim(string claimType, string value)
        {
            _claims.Add(new Claim(claimType, value));
            return this;
        }
        
        public ClaimsPrincipal Build()
        {
            var identity = new ClaimsIdentity(_claims, "TestAuthType");
            var claimsPrincipal = new ClaimsPrincipal(identity);
            return claimsPrincipal;
        }
    }
}
