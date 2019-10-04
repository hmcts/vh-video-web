using System;

namespace Testing.Common.Helpers
{
    public class VideoWebUriFactory
    {
        public VideoWebParticipantsEndpoints ParticipantsEndpoints { get; }
        public VideoWebCallbackEndpoints CallbackEndpoints { get; }

        public VideoWebUriFactory()
        {
            ParticipantsEndpoints = new VideoWebParticipantsEndpoints();
            CallbackEndpoints = new VideoWebCallbackEndpoints();
        }
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
