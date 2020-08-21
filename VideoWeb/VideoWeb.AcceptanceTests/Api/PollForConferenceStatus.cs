using System;
using System.Threading;
using AcceptanceTests.Common.Api.Hearings;
using AcceptanceTests.Common.Api.Helpers;
using VideoWeb.Services.Video;

namespace VideoWeb.AcceptanceTests.Api
{
    public class PollForConferenceStatus
    {
        private readonly VideoApiManager _videoApi;
        private Guid _conferenceId;
        private ConferenceState _expectedState;
        private int _maxRetries = 5;

        public PollForConferenceStatus(VideoApiManager videoApi)
        {
            _videoApi = videoApi;
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
            if (_videoApi == null || _conferenceId == Guid.Empty)
                throw new DataMisalignedException("Video api or conference Id must be set");

            var actualState = ConferenceState.NotStarted;
            for (var i = 0; i < _maxRetries; i++)
            {
                var response = _videoApi.GetConferenceByConferenceId(_conferenceId);
                var conference = RequestHelper.Deserialise<ConferenceDetailsResponse>(response.Content);
                if (conference != null)
                {
                    actualState = conference.Current_status;
                    if (actualState.Equals(_expectedState))
                    {
                        return conference.Current_status;
                    }
                }
                Thread.Sleep(TimeSpan.FromSeconds(1));
            }
            throw new DataMisalignedException($"Expected hearing state to be updated to {_expectedState} but was {actualState}");
        }
    }
}
