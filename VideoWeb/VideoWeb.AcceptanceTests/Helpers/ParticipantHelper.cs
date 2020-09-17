using System.Collections.Generic;

namespace VideoWeb.AcceptanceTests.Helpers
{
    public static class ParticipantHelper
    {
        public static int GetIndexFromNumber(string number)
        {
            var numberTable = new Dictionary<string, int>
            {
                {"first", 0},
                {"second", 1},
                {"third", 2},
                {"fourth", 3},
                {"fifth", 4}
            };
            return numberTable[number];
        }

        public static string GetNumberFromIndex(int index)
        {
            var indexTable = new Dictionary<int, string>
            {
                {0, "first"},
                {1, "second"},
                {2, "third"},
                {3, "fourth"},
                {4, "fifth"}
            };
            return indexTable[index];
        }


    }
}
