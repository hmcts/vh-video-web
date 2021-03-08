using System;
using System.Collections.Generic;
using VideoWeb.Services.TestApi;

namespace VideoWeb.AcceptanceTests.Builders
{
    internal class HearingRequestBuilder
    {
        private readonly CreateHearingRequest _request;
        private const string DEFAULT_VENUE = "Birmingham Civil and Family Justice Centre";
        private const string CASE_TYPE_NAME = "Generic";
        private const string CACD_CASE_TYPE_NAME = "Court of Appeal Criminal Division";

        public HearingRequestBuilder()
        {
            _request = new CreateHearingRequest()
            {
                Application = Application.VideoWeb,
                Audio_recording_required = false,
                Case_type = CASE_TYPE_NAME,
                Questionnaire_not_required = true,
                Scheduled_date_time = DateTime.UtcNow,
                Test_type = TestType.Automated,
                Users = new List<UserDto>(),
                Venue = DEFAULT_VENUE
            };
        }

        public HearingRequestBuilder WithUsers(List<UserDto> users)
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

        public HearingRequestBuilder WithCACDCaseType()
        {
            _request.Case_type = CACD_CASE_TYPE_NAME;
            return this;
        }

        public CreateHearingRequest Build()
        {
            return _request;
        }
    }
}
