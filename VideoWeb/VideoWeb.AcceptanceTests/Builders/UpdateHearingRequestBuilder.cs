using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using VideoWeb.Services.Bookings;

namespace VideoWeb.AcceptanceTests.Builders
{
    public class UpdateHearingRequestBuilder
    {
        private readonly UpdateHearingRequest _request;
        private HearingDetailsResponse _hearing;
        private string _appendWord;
        private int _addMinutes;
        private string _venue = "Birmingham Civil and Family Justice Centre";
        private string _updatedBy;

        public UpdateHearingRequestBuilder()
        {
            _request = new UpdateHearingRequest {Cases = new List<CaseRequest>()};
        }

        public UpdateHearingRequestBuilder ForHearing(HearingDetailsResponse hearing)
        {
            _hearing = hearing;
            return this;
        }

        public UpdateHearingRequestBuilder AddWordToStrings(string word)
        {
            _appendWord = word;
            return this;
        }

        public UpdateHearingRequestBuilder AddMinutesToTimes(int minutes)
        {
            _addMinutes = minutes;
            return this;
        }

        public UpdateHearingRequestBuilder ChangeVenue()
        {
            _venue = "Manchester Civil and Family Justice Centre";
            return this;
        }

        public UpdateHearingRequestBuilder UpdatedBy(string updatedBy)
        {
            _updatedBy = updatedBy;
            return this;
        }

        public UpdateHearingRequest Build()
        {
            AssertDataNotNull();
            _request.Cases.Add(new CaseRequest()
            {
                Name = $"{_appendWord} {_hearing.Cases.First().Name}",
                Number = $"{_appendWord} {_hearing.Cases.First().Number}",
                Is_lead_case = false
            });
            _request.Hearing_room_name = $"{_appendWord} {_hearing.Hearing_room_name}";
            _request.Hearing_venue_name = _venue;
            _request.Other_information = $"{_appendWord} {_hearing.Other_information}";
            _request.Scheduled_date_time = _hearing.Scheduled_date_time.AddMinutes(_addMinutes);
            _request.Scheduled_duration = _hearing.Scheduled_duration + _addMinutes;
            _request.Updated_by = _updatedBy;
            return _request;
        }

        private void AssertDataNotNull()
        {
            if (_hearing.Scheduled_date_time == DateTime.MinValue || _hearing.Scheduled_duration == 0)
            {
                throw new DataException("Scheduled datetime or duration cannot be null");
            }
        }
    }
}
