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
                listedFor = timespan.Minutes.Equals(1) ? $"{timespan.Minutes} minute" : $"{timespan.Minutes} minutes";
            }
            else
            {
                listedFor = timespan.Hours.Equals(1) ? $"{timespan.Hours} hour" : $"{timespan.Hours} hours";
            }

            if (timespan.Minutes.Equals(0) || timespan.Hours <= 0) return listedFor;
            if (timespan.Minutes.Equals(1))
            {
                listedFor += $" and 1 minute";
            }
            else
            {
                listedFor += $" and {timespan.Minutes} minutes";
            }

            return listedFor;
        }
    }
}
