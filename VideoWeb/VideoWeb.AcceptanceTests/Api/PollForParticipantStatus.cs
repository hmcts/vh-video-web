using System;
using System.Collections.Generic;
using System.Threading;
using AcceptanceTests.Common.Api.Hearings;
using AcceptanceTests.Common.Api.Helpers;
using FluentAssertions;
using TestApi.Client;
using TestApi.Contract.Dtos;
using TestApi.Contract.Enums;
using VideoApi.Contract.Enums;
using VideoApi.Contract.Responses;

namespace VideoWeb.AcceptanceTests.Api
{
    public class PollForParticipantStatus
    {
        private readonly TestApiManager _api;
        private Guid _conferenceId;
        private string _username;
        private List<ParticipantState> _expectedStates;
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

        public PollForParticipantStatus WithExpectedState(params ParticipantState [] expectedStates)
        {
            _expectedStates = new List<ParticipantState>(expectedStates);
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
                actualState = participant.CurrentStatus;
                if (_expectedStates.Contains(actualState))
                {
                    return actualState;
                }
                Thread.Sleep(TimeSpan.FromSeconds(1));
            }
            throw new DataMisalignedException($"Expected participant state to be updated to {_expectedStates} but was {actualState}");
        }
    }
}
