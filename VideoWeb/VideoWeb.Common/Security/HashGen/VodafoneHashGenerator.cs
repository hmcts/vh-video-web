using System.Linq;
using System.Security.Cryptography;
using System.Text;

namespace VideoWeb.Common.Security.HashGen
{
    public interface IHashGenerator
    {
        string GenerateSelfTestTokenHash(string expiresOnUtc, string data);
    }

    public class VodafoneHashGenerator : IHashGenerator
    {
        private readonly VodafoneConfiguration _vodafoneConfiguration;

        public VodafoneHashGenerator(VodafoneConfiguration vodafoneConfiguration)
        {
            _vodafoneConfiguration = vodafoneConfiguration;
        }

        public string GenerateSelfTestTokenHash(string expiresOnUtc, string data)
        {
            var asciiEncoding = new ASCIIEncoding();
            var stringToHash = $"{expiresOnUtc}{data}";

            var keyBytes = asciiEncoding.GetBytes(_vodafoneConfiguration.SelfTestApiSecret);
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
