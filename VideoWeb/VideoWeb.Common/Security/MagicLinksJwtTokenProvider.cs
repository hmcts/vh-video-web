using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using VideoWeb.Common.Configuration;
using VideoWeb.Common.Models;

namespace VideoWeb.Common.Security
{
    public class MagicLinksJwtTokenProvider : IMagicLinksJwtTokenProvider
    {
        private readonly MagicLinksConfiguration _magicLinksConfiguration;

        public MagicLinksJwtTokenProvider(IOptions<MagicLinksConfiguration> magicLinksConfiguration)
        {
            _magicLinksConfiguration = magicLinksConfiguration.Value;
        }

        public string GenerateToken(string name, string role, int expiresInMinutes)
        {
            var key = Convert.FromBase64String(_magicLinksConfiguration.JwtProviderSecret);

            var claims = new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.Name, name),
                new Claim(ClaimTypes.GivenName, name),
                new Claim(ClaimTypes.Surname, name),
                new Claim("preferred_username", name),
                new Claim("name", name),
                new Claim(ClaimTypes.Role, role)
            });
            
            return BuildToken(claims, expiresInMinutes, key);
        }

        private string BuildToken(ClaimsIdentity claims, int expiresInMinutes, byte[] key)
        {
            var securityKey = new SymmetricSecurityKey(key);
            var descriptor = new SecurityTokenDescriptor
            {
                Subject = claims,
                NotBefore = DateTime.UtcNow.AddMinutes(-1),
                Issuer = _magicLinksConfiguration.Issuer,
                Expires = DateTime.UtcNow.AddMinutes(expiresInMinutes + 1),
                SigningCredentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha512)
            };

            var handler = new JwtSecurityTokenHandler();
            var token = handler.CreateJwtSecurityToken(descriptor);
            return handler.WriteToken(token);
        }
    }
}
