using System.Linq;
using System.Security.Cryptography;
using System.Text;

namespace VideoWeb.Common.Security.HashGen
{
    public interface IHashGenerator
    {
        string GenerateHash(string expiresOnUtc, string data);
    }

    public class HashGenerator : IHashGenerator
    {
        private readonly CustomTokenSettings _customTokenSettings;

        public HashGenerator(CustomTokenSettings customTokenSettings)
        {
            _customTokenSettings = customTokenSettings;
        }

        public string GenerateHash(string expiresOnUtc, string data)
        {
            var asciiEncoding = new ASCIIEncoding();
            var stringToHash = $"{expiresOnUtc}{data}";

            var keyBytes = asciiEncoding.GetBytes(_customTokenSettings.Secret);
            var messageBytes = asciiEncoding.GetBytes(stringToHash);

            using (var hmac = new HMACSHA256(keyBytes))
            {
                var computedHash = hmac.ComputeHash(messageBytes);
                return ByteToString(computedHash);
            }
        }

        public static string ByteToString(byte[] buffer)
        {
            var byteToString = buffer.Aggregate("", (current, iter) => current + iter.ToString("x2"));
            return (byteToString);
        }
    }
}