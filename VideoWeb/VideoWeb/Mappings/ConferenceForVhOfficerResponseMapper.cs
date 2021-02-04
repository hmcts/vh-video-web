using System;
using System.Collections.Generic;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoApi.Contract.Responses;

namespace VideoWeb.Mappings
{
    public class ConferenceForVhOfficerResponseMapper : IMapTo<ConferenceForAdminResponse, ConferenceForVhOfficerResponse>
    {
        private readonly IMapTo<IEnumerable<ParticipantSummaryResponse>, List<ParticipantForUserResponse>> _participantForUserResponseMapper;

        public ConferenceForVhOfficerResponseMapper(IMapTo<IEnumerable<ParticipantSummaryResponse>, List<ParticipantForUserResponse>> participantForUserResponseMapper)
        {
            _participantForUserResponseMapper = participantForUserResponseMapper;
        }

        public ConferenceForVhOfficerResponse Map(ConferenceForAdminResponse conference)
        {
            var response = new ConferenceForVhOfficerResponse
            {
                Id = conference.Id,
                CaseName = conference.CaseName,
                CaseNumber = conference.CaseNumber,
                CaseType = conference.CaseType,
                ScheduledDateTime = conference.ScheduledDateTime,
                ScheduledDuration = conference.ScheduledDuration,
                Status = Enum.Parse<ConferenceStatus>(conference.Status.ToString()),
                HearingVenueName = conference.HearingVenueName,
                Participants = _participantForUserResponseMapper.Map(conference.Participants),
                StartedDateTime = conference.StartedDateTime,
                ClosedDateTime = conference.ClosedDateTime,
                TelephoneConferenceId = conference.TelephoneConferenceId,
                TelephoneConferenceNumber = conference.TelephoneConferenceNumber
            };
            return response;
        }
    }
}
