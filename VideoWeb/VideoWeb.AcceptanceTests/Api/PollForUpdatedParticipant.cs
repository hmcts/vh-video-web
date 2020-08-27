using System;
using System.Threading;
using AcceptanceTests.Common.Api.Hearings;
using AcceptanceTests.Common.Api.Helpers;
using VideoWeb.Services.Video;
using UpdateParticipantRequest = VideoWeb.Services.Bookings.UpdateParticipantRequest;

namespace VideoWeb.AcceptanceTests.Api
{
    public class PollForUpdatedParticipant
    {
        private const int MaxRetries = 5;
        private readonly TestApiManager _api;
        private string _username;
        private Guid _conferenceId;
        private UpdateParticipantRequest _updatedRequest;

        public PollForUpdatedParticipant(TestApiManager api)
        {
            _api = api;
        }

        public PollForUpdatedParticipant WithConferenceId(Guid conferenceId)
        {
            _conferenceId = conferenceId;
            return this;
        }

        public PollForUpdatedParticipant WithUsername(string username)
        {
            _username = username;
            return this;
        }

        public PollForUpdatedParticipant WithUpdatedRequest(UpdateParticipantRequest updatedRequest)
        {
            _updatedRequest = updatedRequest;
            return this;
        }

        public bool Poll()
        {
            for (var i = 0; i < MaxRetries; i++)
            {
                var response = _api.GetConferenceByConferenceId(_conferenceId);
                var conference = RequestHelper.Deserialise<ConferenceDetailsResponse>(response.Content);
                var updatedParticipant = conference.Participants.Find(x => x.Username.ToLower().Equals(_username.ToLower()));
                if (updatedParticipant.Display_name.Equals(_updatedRequest.Display_name) &&
                    updatedParticipant.Name.Contains($"{_updatedRequest.Title}"))
                {
                    return true;
                }
                Thread.Sleep(TimeSpan.FromSeconds(1));
            }

            return false;
        }
    }
}
