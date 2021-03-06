using System;
using System.Collections.Generic;
using TestApi.Client;
using TestApi.Contract.Dtos;
using TestApi.Contract.Dtos;
using TestApi.Contract.Enums;
using TestApi.Contract.Requests;

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
                AudioRecordingRequired = false,
                CaseType = CASE_TYPE_NAME,
                QuestionnaireNotRequired = true,
                ScheduledDateTime = DateTime.UtcNow,
                TestType = TestType.Automated,
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
            _request.ScheduledDateTime = scheduledDateTime;
            return this;
        }

        public HearingRequestBuilder WithVenue(string venue)
        {
            _request.Venue = venue;
            return this;
        }

        public HearingRequestBuilder WithAudioRecordingRequired(bool audioRecordingRequired)
        {
            _request.AudioRecordingRequired = audioRecordingRequired;
            return this;
        }

        public HearingRequestBuilder WithCACDCaseType()
        {
            _request.CaseType = CACD_CASE_TYPE_NAME;
            return this;
        }

        public CreateHearingRequest Build()
        {
            return _request;
        }
    }
}
