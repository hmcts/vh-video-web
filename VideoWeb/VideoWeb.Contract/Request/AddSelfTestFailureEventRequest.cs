using System.ComponentModel;
using VideoApi.Contract.Enums;

namespace VideoWeb.Contract.Request
{
    public class AddSelfTestFailureEventRequest
    {
        public static EventType EventType => EventType.SelfTestFailed;
        public SelfTestFailureReason SelfTestFailureReason { get; set; }
    }

    public enum SelfTestFailureReason
    {
        Camera = 0,
        Microphone = 1,
        Video = 2,
        [Description("Bad Score")]
        BadScore = 3,
        [Description("Incomplete Test")]
        IncompleteTest = 4

    }
}
