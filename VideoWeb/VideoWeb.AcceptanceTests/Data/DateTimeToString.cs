using System;

namespace VideoWeb.AcceptanceTests.Data
{
    public static class DateTimeToString
    {
        public static string GetListedForTimeAsString(TimeSpan timespan)
        {
            string listedFor;

            if (timespan.Hours.Equals(0))
            {
                listedFor = $"{timespan.Minutes}m";
            }
            else
            {
                listedFor = $"{timespan.Hours}h";
            }

            if (timespan.Minutes.Equals(0) || timespan.Hours <= 0) return listedFor;
            if (timespan.Minutes.Equals(1))
            {
                listedFor += $" and 1m";
            }
            else
            {
                listedFor += $" and {timespan.Minutes}m";
            }

            return listedFor;
        }
    }
}
