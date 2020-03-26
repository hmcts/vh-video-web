using System;
using System.Threading;
using AcceptanceTests.Common.Api.Hearings;
using AcceptanceTests.Common.Api.Helpers;
using FluentAssertions;
using VideoWeb.Services.Video;

namespace VideoWeb.AcceptanceTests.Api
{
    public class PollForParticipantStatus
    {
        private readonly VideoApiManager _videoApi;
        private Guid _conferenceId;
        private string _username;
        private ParticipantState _expectedState;
        private int _maxRetries = 5;

        public PollForParticipantStatus(VideoApiManager videoApi)
        {
            _videoApi = videoApi;
        }

        public PollForParticipantStatus WithConferenceId(Guid conferenceId)
        {
            _conferenceId = conferenceId;
            return this;
        }

        public PollForParticipantStatus WithParticipant(string username)
        {
            _username = username;
            return this;
        }

        public PollForParticipantStatus WithExpectedState(ParticipantState expectedState)
        {
            _expectedState = expectedState;
            return this;
        }

        public PollForParticipantStatus Retries(int maxRetries)
        {
            _maxRetries = maxRetries;
            return this;
        }

        public ParticipantState Poll()
        {
            for (var i = 0; i < _maxRetries; i++)
            {
                var response = _videoApi.GetConferenceByConferenceId(_conferenceId);
                var conference = RequestHelper.DeserialiseSnakeCaseJsonToResponse<ConferenceDetailsResponse>(response.Content);
                conference.Should().NotBeNull();
                var participant = conference.Participants.Find(x => x.Username.ToLower().Equals(_username.ToLower()));
                var participantState = participant.Current_status;
                if (participantState.Equals(_expectedState))
                {
                    return participantState;
                }
                Thread.Sleep(TimeSpan.FromSeconds(1));
            }
            throw new DataMisalignedException($"Participant state not updated to {_expectedState}");
        }
    }
}
