using VideoWeb.Mappings.Interfaces;
using VideoWeb.Services.Video;

namespace VideoWeb.Mappings
{
    public class EventTypeReasonMapper : IMapTo<EventType, string>
    { 
        public string Map(EventType eventType)
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
