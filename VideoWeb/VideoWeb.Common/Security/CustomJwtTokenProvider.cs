using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using VideoWeb.Common.Security.HashGen;

namespace VideoWeb.Common.Security
{
    public interface ICustomJwtTokenProvider
    {
        string GenerateTokenForCallbackEndpoint(string claims, int expiresInMinutes);
        string GenerateToken(string claims, int expiresInMinutes);
    }

    public class CustomJwtTokenProvider : ICustomJwtTokenProvider
    {
        private readonly CustomTokenSettings _customTokenSettings;

        public CustomJwtTokenProvider(CustomTokenSettings customTokenSettings)
        {
            _customTokenSettings = customTokenSettings;
        }

        public string GenerateTokenForCallbackEndpoint(string claims, int expiresInMinutes)
        {
            var key = new ASCIIEncoding().GetBytes(_customTokenSettings.ThirdPartySecret);
            return BuildToken(claims, expiresInMinutes, key);
        }

        public string GenerateToken(string claims, int expiresInMinutes)
        {
            var key = Convert.FromBase64String(_customTokenSettings.Secret);
            return BuildToken(claims, expiresInMinutes, key);
        }

        private string BuildToken(string claims, int expiresInMinutes, byte[] key)
        {
            var securityKey = new SymmetricSecurityKey(key);
            var descriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[] {new Claim(ClaimTypes.Name, claims)}),
                NotBefore = DateTime.UtcNow.AddMinutes(-1),
                Issuer = _customTokenSettings.Issuer,
                Expires = DateTime.UtcNow.AddMinutes(expiresInMinutes + 1),
                SigningCredentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256Signature)
            };

            var handler = new JwtSecurityTokenHandler();
            var token = handler.CreateJwtSecurityToken(descriptor);
            return handler.WriteToken(token);
        }
    }
}