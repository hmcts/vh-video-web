using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using VideoWeb.Common.Security.HashGen;

namespace VideoWeb.Common.Security
{
    public class KinlyJwtTokenProvider : IKinlyJwtTokenProvider
    {
        private readonly KinlyConfiguration _kinlyConfiguration;

        public KinlyJwtTokenProvider(KinlyConfiguration kinlyConfiguration)
        {
            _kinlyConfiguration = kinlyConfiguration;
        }

        public string GenerateTokenForCallbackEndpoint(string claims, int expiresInMinutes)
        {
            var key = Convert.FromBase64String(_kinlyConfiguration.CallbackSecret);
            return BuildToken(claims, expiresInMinutes, key);
        }

        public string GenerateToken(string claims, int expiresInMinutes)
        {
            var key = Convert.FromBase64String(_kinlyConfiguration.ApiSecret);
            return BuildToken(claims, expiresInMinutes, key);
        }

        private string BuildToken(string claims, int expiresInMinutes, byte[] key)
        {
            var securityKey = new SymmetricSecurityKey(key);
            var descriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[] {new Claim(ClaimTypes.Name, claims)}),
                NotBefore = DateTime.UtcNow.AddMinutes(-1),
                Issuer = _kinlyConfiguration.Issuer,
                Expires = DateTime.UtcNow.AddMinutes(expiresInMinutes + 1),
                SigningCredentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha512)
            };

            var handler = new JwtSecurityTokenHandler();
            var token = handler.CreateJwtSecurityToken(descriptor);
            return handler.WriteToken(token);
        }
    }
}
