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
        private readonly TestApiManager _api;
        private Guid _conferenceId;
        private string _username;
        private ParticipantState _expectedState;
        private int _maxRetries = 5;

        public PollForParticipantStatus(TestApiManager api)
        {
            _api = api;
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
            var actualState = ParticipantState.None;
            for (var i = 0; i < _maxRetries; i++)
            {
                var response = _api.GetConferenceByConferenceId(_conferenceId);
                var conference = RequestHelper.Deserialise<ConferenceDetailsResponse>(response.Content);
                conference.Should().NotBeNull();
                var participant = conference.Participants.Find(x => x.Username.ToLower().Equals(_username.ToLower()));
                actualState = participant.Current_status;
                if (actualState.Equals(_expectedState))
                {
                    return actualState;
                }
                Thread.Sleep(TimeSpan.FromSeconds(1));
            }
            throw new DataMisalignedException($"Expected participant state to be updated to {_expectedState} but was {actualState}");
        }
    }
}
