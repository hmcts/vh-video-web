using System;
using System.Collections.Generic;
using VideoWeb.Services.TestApi;

namespace VideoWeb.AcceptanceTests.Builders
{
    internal class HearingRequestBuilder
    {
        private readonly CreateHearingRequest _request;
        private const string DEFAULT_VENUE = "Birmingham Civil and Family Justice Centre";

        public HearingRequestBuilder()
        {
            _request = new CreateHearingRequest()
            {
                Application = Application.VideoWeb,
                Audio_recording_required = false,
                Questionnaire_not_required = true,
                Scheduled_date_time = DateTime.UtcNow,
                Test_type = TestType.Automated,
                Users = new List<User>(),
                Venue = DEFAULT_VENUE
            };
        }

        public HearingRequestBuilder WithUsers(List<User> users)
        {
            _request.Users = users;
            return this;
        }

        public HearingRequestBuilder WithScheduledTime(DateTime scheduledDateTime)
        {
            _request.Scheduled_date_time = scheduledDateTime;
            return this;
        }

        public HearingRequestBuilder WithVenue(string venue)
        {
            _request.Venue = venue;
            return this;
        }

        public HearingRequestBuilder WithAudioRecordingRequired(bool audioRecordingRequired)
        {
            _request.Audio_recording_required = audioRecordingRequired;
            return this;
        }

        public CreateHearingRequest Build()
        {
            return _request;
        }
    }
}
