using System;
using System.Threading;
using AcceptanceTests.Common.Api.Hearings;
using AcceptanceTests.Common.Api.Helpers;
using VideoWeb.Services.Video;

namespace VideoWeb.AcceptanceTests.Api
{
    public class PollForUpdatedConference
    {
        private const int MaxRetries = 5;
        private readonly TestApiManager _api;
        private string _updatedWord;
        private Guid _conferenceId;

        public PollForUpdatedConference(TestApiManager api)
        {
            _api = api;
        }

        public PollForUpdatedConference WithConferenceId(Guid conferenceId)
        {
            _conferenceId = conferenceId;
            return this;
        }

        public PollForUpdatedConference WithUpdatedWord(string updatedWord)
        {
            _updatedWord = updatedWord;
            return this;
        }
        public ConferenceDetailsResponse Poll()
        {
            for (var i = 0; i < MaxRetries; i++)
            {
                var response = _api.GetConferenceByConferenceId(_conferenceId);
                var conference = RequestHelper.Deserialise<ConferenceDetailsResponse>(response.Content);
                if (conference.Case_name.Contains(_updatedWord))
                    return conference;
                Thread.Sleep(TimeSpan.FromSeconds(1));
            }

            throw new DataMisalignedException($"Conference not updated with updated word '{_updatedWord}'");
        }


    }
}
