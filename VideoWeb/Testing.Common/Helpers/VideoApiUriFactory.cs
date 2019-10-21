using System;

namespace Testing.Common.Helpers
{
    public class VideoApiUriFactory
    {
        public VideoEventsEndpoints VideoEventsEndpoints { get; }
        public ParticipantsEndpoints ParticipantsEndpoints { get; }
        public ConferenceEndpoints ConferenceEndpoints { get; }
        public VideoApiHealthCheckEndpoints HealthCheckEndpoints { get; set; }

        public VideoApiUriFactory()
        {
            ParticipantsEndpoints = new ParticipantsEndpoints();
            ConferenceEndpoints = new ConferenceEndpoints();
            VideoEventsEndpoints = new VideoEventsEndpoints();
            HealthCheckEndpoints = new VideoApiHealthCheckEndpoints();
        }
    }

    public class VideoEventsEndpoints
    {
        private static string ApiRoot => "events";
        public string Event => $"{ApiRoot}";
    }

    public class ParticipantsEndpoints
    {
        private static string ApiRoot => "conferences";

        public string AddParticipantsToConference(Guid conferenceId) => $"{ApiRoot}/{conferenceId}/participants";

        public string RemoveParticipantFromConference(Guid conferenceId, Guid participantId) =>
            $"{ApiRoot}/{conferenceId}/participants/{participantId}";

        public string GetSelfTestScore(Guid conferenceId, Guid? participantId) =>
            $"{ApiRoot}/{conferenceId}/participants/{participantId}/selftestresult";
    }

    public class ConferenceEndpoints
    {
        private static string ApiRoot => "conferences";
        public string BookNewConference => $"{ApiRoot}";
        public string UpdateConferenceStatus(Guid conferenceId) => $"{ApiRoot}/{conferenceId}";
        public string GetConferenceDetailsByUsername(string username) => $"{ApiRoot}/?username={username}";
        public string GetConferenceDetailsById(Guid conferenceId) => $"{ApiRoot}/{conferenceId}";
        public string GetConferenceByHearingRefId(Guid hearingRefId) => $"{ApiRoot}/hearings/{hearingRefId}";
        public string RemoveConference(Guid? conferenceId) => $"{ApiRoot}/{conferenceId}";
        public string GetTodaysConferences => $"{ApiRoot}/today";
    }

    public class VideoApiHealthCheckEndpoints
    {
        private static string ApiRoot => "/healthcheck";

        public string CheckServiceHealth()
        {
            return $"{ApiRoot}/health";
        }
    }
}
