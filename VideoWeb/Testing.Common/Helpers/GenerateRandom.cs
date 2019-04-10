using System;

namespace Testing.Common.Helpers
{
    public static class GenerateRandom
    {
        private const int Length = 6;
        private const char V = 'a';

        public static string Letters(Random randomNumber)
        {
            var randomString = "";
            for (var i = 0; i < Length; i++)
            {
                randomString += (char)(randomNumber.Next(26) + V);
            }
            return randomString.ToUpper();
        }

        public static string Numbers(Random randomNumber)
        {
            return randomNumber.Next(0, 999999).ToString("D6");
        }
    }
}
