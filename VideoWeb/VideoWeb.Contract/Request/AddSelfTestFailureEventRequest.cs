using System;
using VideoWeb.Services.Video;

namespace VideoWeb.Contract.Request
{
    public class AddSelfTestFailureEventRequest
    {
        public Guid ParticipantId { get; set; }
        public EventType EventType => EventType.SelfTestFailed;
        public SelfTestFailureReason SelfTestFailureReason { get; set; }
    }

    public enum SelfTestFailureReason
    {
        Camera = 0,
        Microphone = 1,
        Video = 2
    }
}
