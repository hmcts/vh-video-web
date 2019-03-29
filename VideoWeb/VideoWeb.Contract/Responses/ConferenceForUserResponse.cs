using System;
using System.Collections.Generic;
using VideoWeb.Common.Enums;

namespace VideoWeb.Contract.Responses
{
    public class ConferenceForUserResponse
    {
        public Guid Id { get; set; }
        public DateTime ScheduledDateTime { get; set; }
        public string CaseType { get; set; }
        public string CaseNumber { get; set; }
        public string CaseName { get; set; }
        public int? ScheduledDuration { get; set; }
        public ConferenceState? Status { get; set; }
        public List<ParticipantSummaryResponse> Participants { get; set; }
        public int NoOfParticipantsNone { get; set; }
        public int NoOfParticipantsNotSignedIn { get; set; }
        public int NoOfParticipantsUnableToJoin { get; set; }
        public int NoOfParticipantsJoining { get; set; }
        public int NoOfParticipantsAvailable { get; set; }
        public int NoOfParticipantsInHearing { get; set; }
        public int NoOfParticipantsInConsultation { get; set; }
        public int NoOfParticipantsDisconnected { get; set; }
    }
}