using System;

namespace Testing.Common.Helpers
{
    public class VideoWebUriFactory
    {
        public VideoWebParticipantsEndpoints ParticipantsEndpoints { get; }

        public VideoWebUriFactory()
        {
            ParticipantsEndpoints = new VideoWebParticipantsEndpoints();
        }
    }

    public class VideoWebParticipantsEndpoints
    {
        private static string ApiRoot => "conferences";

        public string SelfTestResult(Guid? conferenceId, Guid? participantId) =>
            $"{ApiRoot}/{conferenceId}/participants/{participantId}/selftestresult";
    }
}
