using System;

namespace Testing.Common.Helpers
{
    public class VideoApiUriFactory
    {
        public CallbackEndpoints CallbackEndpoints { get; }
        public ParticipantsEndpoints ParticipantsEndpoints { get; }
        public ConferenceEndpoints ConferenceEndpoints { get; }
        public VideoApiHealthCheckEndpoints HealthCheckEndpoints { get; set; }

        public VideoApiUriFactory()
        {
            ParticipantsEndpoints = new ParticipantsEndpoints();
            ConferenceEndpoints = new ConferenceEndpoints();
            CallbackEndpoints = new CallbackEndpoints();
            HealthCheckEndpoints = new VideoApiHealthCheckEndpoints();
        }
    }

    public class CallbackEndpoints
    {
        private static string ApiRoot => "callback";
        public string Event => $"{ApiRoot}/conference";
    }

    public class ParticipantsEndpoints
    {
        private static string ApiRoot => "conferences";

        public string AddParticipantsToConference(Guid conferenceId) => $"{ApiRoot}/{conferenceId}/participants";

        public string RemoveParticipantFromConference(Guid conferenceId, Guid participantId) =>
            $"{ApiRoot}/{conferenceId}/participants/{participantId}";
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
