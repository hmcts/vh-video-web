using System;

namespace Testing.Common.Helpers
{
    public static class GenerateRandom
    {
        private const int Length = 6;

        public static string Letters(Random randomNumber)
        {
            var randomString = "";
            for (var i = 0; i < Length; i++)
            {
                randomString += (char)(randomNumber.Next(26) + 'a');
            }
            return randomString.ToUpper();
        }

        public static string Numbers(Random randomNumber)
        {
            var randomString = "";
            for (var i = 0; i < Length; i++)
            {
                randomString += ((char)randomNumber.Next(97, 122)).ToString();
            }
            return randomString.ToUpper();
        }
    }
}
