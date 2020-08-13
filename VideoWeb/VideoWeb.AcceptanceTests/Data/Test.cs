using System;
using System.Collections.Generic;
using AcceptanceTests.Common.Data.TestData;
using VideoWeb.AcceptanceTests.Data.TestData;
using VideoWeb.Services.Bookings;
using VideoWeb.Services.Video;

namespace VideoWeb.AcceptanceTests.Data
{
    public class Test
    {
        public DateTime AlertTime { get; set; }
        public CaseResponse Case { get; set; }
        public CommonData CommonData { get; set; }
        public ConferenceDetailsResponse Conference { get; set; }
        public List<ParticipantDetailsResponse> ConferenceParticipants { get; set; }
        public List<ConferenceDetailsResponse> Conferences { get; set; }
        public int DelayedStartTime { get; set; } = 0;
        public HearingDetailsResponse Hearing { get; set; }
        public List<ParticipantResponse> HearingParticipants { get; set; }
        public Guid NewConferenceId { get; set; }
        public Guid NewHearingId { get; set; }
        public ParticipantDetailsResponse Participant { get; set; }
        public bool SelfTestJourney { get; set; } = false;
        public long TaskId { get; set; }
        public DefaultData TestData { get; set; }
    }
}
