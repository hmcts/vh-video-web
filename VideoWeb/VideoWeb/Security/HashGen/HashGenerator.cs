using System;
using System.Security.Cryptography;
using System.Text;

namespace VideoWeb.Security.HashGen
{
    public interface IHashGenerator
    {
        string GenerateHash(DateTime expiresOnUtc, string data);
    }

    public class HashGenerator : IHashGenerator
    {
        private readonly CustomTokenSettings _customTokenSettings;

        public HashGenerator(CustomTokenSettings customTokenSettings)
        {
            _customTokenSettings = customTokenSettings;
        }

        public string GenerateHash(DateTime expiresOnUtc, string data)
        {
            var key = Convert.FromBase64String(_customTokenSettings.Secret);
            var stringToHash = $"{expiresOnUtc}{data}";

            var request = Encoding.UTF8.GetBytes(stringToHash);
            using (var hmac = new HMACSHA256(key))
            {
                var computedHash = hmac.ComputeHash(request);
                return Convert.ToBase64String(computedHash);
            }
        }
    }
}