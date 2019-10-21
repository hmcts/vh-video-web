using System;

namespace Testing.Common.Helpers
{
    public class VideoWebUriFactory
    {
        public VideoWebParticipantsEndpoints ParticipantsEndpoints { get; }
        public VideoWebCallbackEndpoints CallbackEndpoints { get; }
        public VideoWebMediaEventEndpoints MediaEventEndpoints { get; }

        public VideoWebUriFactory()
        {
            ParticipantsEndpoints = new VideoWebParticipantsEndpoints();
            CallbackEndpoints = new VideoWebCallbackEndpoints();
            MediaEventEndpoints = new VideoWebMediaEventEndpoints();
        }
    }

    public class VideoWebMediaEventEndpoints
    {
        private static string ApiRoot => "conferences";

        public string SelfTestFailureEvents(Guid conferenceId) => $"{ApiRoot}/{conferenceId}/selftestfailureevents";
    }

    public class VideoWebParticipantsEndpoints
    {
        private static string ApiRoot => "conferences";

        public string SelfTestResult(Guid? conferenceId, Guid? participantId) =>
            $"{ApiRoot}/{conferenceId}/participants/{participantId}/selftestresult";
    }

    public class VideoWebCallbackEndpoints
    {
        private static string ApiRoot => "callback";
        public string Event => $"{ApiRoot}";
    }
}
