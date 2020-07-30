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
                EventType.ParticipantNotSignedIn => "participant not signed in",
                _ => string.Empty
            };

            return reason;
        }
    }
}
