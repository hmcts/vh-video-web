using VideoWeb.Services.Video;

namespace VideoWeb.Mappings
{
    public static class EventTypeReasonMapper
    { 

        public static string Map(EventType eventType)
        {
            var reason = eventType switch
            {
                EventType.ParticipantJoining => "participant joining",
                EventType.JudgeAvailable => "judge available",
                EventType.JudgeUnavailable => "judge unavailable",
                _ => string.Empty
            };

            return reason;
        }
    }
}
