using VideoWeb.Services.Video;

namespace VideoWeb.Common.Extensions
{
    public static class ConferenceExtensions
    {
        public static bool IsInStateToChat(this ConferenceForAdminResponse conference)
        {
            return conference.Status == ConferenceState.NotStarted ||
                   conference.Status == ConferenceState.Paused ||
                   conference.Status == ConferenceState.Suspended;
        } 
    }
}
