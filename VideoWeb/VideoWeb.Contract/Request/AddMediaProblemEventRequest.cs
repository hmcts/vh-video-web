using System;
using VideoWeb.Services.Video;

namespace VideoWeb.Contract.Request
{
    public class AddMediaProblemEventRequest
    {
        public Guid ParticipantId { get; set; }
        public EventType EventType => EventType.MediaProblem;
        public MediaType MediaType { get; set; }
    }

    public enum MediaType
    {
        Camera = 0,
        Microphone = 1,
        Video = 2
    }
}
