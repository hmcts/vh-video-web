using System;
using System.Threading;
using AcceptanceTests.Common.Api.Hearings;
using AcceptanceTests.Common.Api.Helpers;
using TestApi.Client;
using TestApi.Contract.Dtos;
using TestApi.Contract.Enums;
using VideoApi.Contract.Enums;
using VideoApi.Contract.Responses;

namespace VideoWeb.AcceptanceTests.Api
{
    public class PollForConferenceStatus
    {
        private readonly TestApiManager _api;
        private Guid _conferenceId;
        private ConferenceState _expectedState;
        private int _maxRetries = 5;

        public PollForConferenceStatus(TestApiManager api)
        {
            _api = api;
        }

        public PollForConferenceStatus WithConferenceId(Guid conferenceId)
        {
            _conferenceId = conferenceId;
            return this;
        }

        public PollForConferenceStatus WithExpectedState(ConferenceState expectedState)
        {
            _expectedState = expectedState;
            return this;
        }

        public PollForConferenceStatus Retries(int maxRetries)
        {
            _maxRetries = maxRetries;
            return this;
        }

        public ConferenceState Poll()
        {
            if (_api == null || _conferenceId == Guid.Empty)
                throw new DataMisalignedException("Video api or conference Id must be set");

            var actualState = ConferenceState.NotStarted;
            for (var i = 0; i < _maxRetries; i++)
            {
                var response = _api.GetConferenceByConferenceId(_conferenceId);
                var conference = RequestHelper.Deserialise<ConferenceDetailsResponse>(response.Content);
                if (conference != null)
                {
                    actualState = conference.CurrentStatus;
                    if (actualState.Equals(_expectedState))
                    {
                        return conference.CurrentStatus;
                    }
                }
                Thread.Sleep(TimeSpan.FromSeconds(1));
            }
            throw new DataMisalignedException($"Expected hearing state to be updated to {_expectedState} but was {actualState}");
        }
    }
}
