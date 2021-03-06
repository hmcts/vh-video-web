using VideoApi.Contract.Enums;
using VideoApi.Contract.Responses;

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
