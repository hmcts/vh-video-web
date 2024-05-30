using System.Collections.Generic;
using System.Security.Claims;

namespace VideoWeb.UnitTests.Builders
{
    public class ClaimsPrincipalBuilder
    {
        public const string Username = "john@hmcts.net";
        
        private readonly List<Claim> _claims = [];
        public ClaimsPrincipalBuilder(bool includeGivenName = true, bool includeSurname = true, bool includeDefaultClaims = true)
        {
            if (includeDefaultClaims)
            {
                _claims =
                [
                    new Claim("preferred_username", Username),
                    new Claim(ClaimTypes.NameIdentifier, "userId"),
                    new Claim(ClaimTypes.Name, "John Doe")
                ];
            }

            if (includeGivenName)
            {
                _claims.Add(new Claim(ClaimTypes.GivenName, "John"));
            }

            if (includeSurname)
            {
                _claims.Add(new Claim(ClaimTypes.Surname, "Doe"));
            }
        }

        public ClaimsPrincipalBuilder WithRole(params string[] roles)
        {
            foreach (var role in roles)
                _claims.Add(new Claim(ClaimTypes.Role, role));
            return this;
        }
        
        public ClaimsPrincipalBuilder WithUsername(string username)
        {
            var usernameClaimIndex = _claims.FindIndex(x => x.Type == "preferred_username");
            _claims.RemoveAt(usernameClaimIndex);
            return WithClaim("preferred_username", username);
        }

        public ClaimsPrincipalBuilder WithClaim(string claimType, string value)
        {
            _claims.Add(new Claim(claimType, value));
            return this;
        }
        
        public ClaimsPrincipal Build()
        {
            var identity = new ClaimsIdentity(_claims, "TestAuthType", "preferred_username", ClaimTypes.Role);
            var claimsPrincipal = new ClaimsPrincipal(identity);
            return claimsPrincipal;
        }
    }
}
