using VideoApi.Contract.Requests;

namespace VideoWeb.Contract.Request;

public class StartOrResumeVideoHearingRequest
{
    public HearingLayout? Layout { get; set; }
}
