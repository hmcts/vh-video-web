using VideoWeb.Services.Video;


namespace VideoWeb.Mappings
{
    public static class EventTypeReasonMapper
    { 

        public static string Map(EventType eventType)
        {
            var reason = string.Empty;
            switch (eventType)
            {
                case EventType.Joined:
                    reason = "participant joining";
                    break;
                case EventType.JudgeAvailable:
                    reason = "judge available";
                    break;
                case EventType.JudgeUnavailable:
                    reason = "judge unavailable";
                    break;
                default:
                    break;
            }

            return reason;
        }
    }
}
