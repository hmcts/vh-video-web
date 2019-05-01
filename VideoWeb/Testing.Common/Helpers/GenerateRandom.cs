using System;
using System.Text;

namespace Testing.Common.Helpers
{
    public static class GenerateRandom
    {
        private const int Length = 6;
        private const char A = 'a';

        public static string Letters(Random randomNumber)
        {
            var randomStringBuilder = new StringBuilder();
            for (var i = 0; i < Length; i++)
            {
                randomStringBuilder.Append((char)(randomNumber.Next(26) + A));
            }

            return randomStringBuilder.ToString().ToUpper();
        }

        public static string CaseNumber(Random randomNumber)
        {
            var randomStringBuilder = new StringBuilder();
            randomStringBuilder.Append(GenerateRandomLetter(randomNumber));
            randomStringBuilder.Append(GenerateRandomLetter(randomNumber));
            randomStringBuilder.Append(randomNumber.Next(0, 99).ToString("D2"));
            randomStringBuilder.Append("/");
            randomStringBuilder.Append(GenerateRandomLetter(randomNumber));
            randomStringBuilder.Append(randomNumber.Next(0, 99999).ToString("D5"));

            return randomStringBuilder.ToString().ToUpper();
        }

        private static char GenerateRandomLetter(Random randomNumber)
        {
            return (char) (randomNumber.Next(26) + A);
        }
    }
}
