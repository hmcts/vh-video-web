using System;
using VideoWeb.Services.Video;

namespace VideoWeb.Helpers
{
    public static class ConferenceHelper
    {
        public static bool HasNotPassed(ConferenceSummaryResponse conference)
        {
            if (conference.Status != ConferenceState.Closed)
            {
                return true;
            }

            // After a conference is closed, VH Officers can still administer conferences until this period of time
            const int postClosedVisibilityTime = 30;
            var endTime = conference.Closed_date_time.Value.AddMinutes(postClosedVisibilityTime);
            return DateTime.UtcNow < endTime;
        }
    }
}
