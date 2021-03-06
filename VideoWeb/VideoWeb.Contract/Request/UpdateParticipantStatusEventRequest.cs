using VideoApi.Contract.Enums;

namespace VideoWeb.Contract.Request
{
    public class UpdateParticipantStatusEventRequest
    {
        public EventType EventType { get; set; }
    }
}
