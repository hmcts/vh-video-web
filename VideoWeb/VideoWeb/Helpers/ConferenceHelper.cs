using System;
using VideoWeb.Services.Video;

namespace VideoWeb.Helpers
{
    public static class ConferenceHelper
    {
        public static bool HasNotPassed(ConferenceState status, DateTime? closedDateTime)
        {
            if (status != ConferenceState.Closed)
            {
                return true;
            }

            if (!closedDateTime.HasValue)
            {
                throw new ArgumentNullException(nameof(closedDateTime), "A closed conference must have a closed time");
            }
            // After a conference is closed, VH Officers can still administer conferences until this period of time
            const int postClosedVisibilityTime = 30;
            var endTime = closedDateTime.Value.AddMinutes(postClosedVisibilityTime);
            return DateTime.UtcNow < endTime;
        }
    }
}
