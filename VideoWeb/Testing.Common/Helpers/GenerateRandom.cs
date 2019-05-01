using System;
using System.Text;

namespace Testing.Common.Helpers
{
    public static class GenerateRandom
    {
        private const int Length = 6;
        private const char V = 'a';

        public static string Letters(Random randomNumber)
        {
            var randomStringBuilder = new StringBuilder();
            for (var i = 0; i < Length; i++)
            {
                randomStringBuilder.Append((char)(randomNumber.Next(26) + V));
            }

            return randomStringBuilder.ToString().ToUpper();
        }

        public static string Numbers(Random randomNumber)
        {
            return randomNumber.Next(0, 999999).ToString("D6");
        }

        public static string CaseNumber(Random randomNumber)
        {
            var randomStringBuilder = new StringBuilder();

            for (var i = 1; i <= 2; i++)
            {
                randomStringBuilder.Append((char)(randomNumber.Next(26) + V));
            }

            randomStringBuilder.Append(randomNumber.Next(0, 99).ToString("D2"));
            randomStringBuilder.Append("/");
            randomStringBuilder.Append((char)(randomNumber.Next(26) + V));
            randomStringBuilder.Append(randomNumber.Next(0, 99999).ToString("D5"));

            return randomStringBuilder.ToString().ToUpper();
        }
    }
}
