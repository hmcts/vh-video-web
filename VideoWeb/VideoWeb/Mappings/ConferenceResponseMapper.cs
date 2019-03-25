using System;
using System.Linq;
using VideoWeb.Contract.Responses;
using VideoWeb.Services.Video;

namespace VideoWeb.Mappings
{
    public class ConferenceResponseMapper
    {
        public ConferenceResponse MapConferenceDetailsToResponseModel(ConferenceDetailsResponse conference)
        {
            var status =
                Enum.Parse<ConferenceStatus>(conference.Current_status.Conference_state.GetValueOrDefault()
                    .ToString());
            
            var participantMapper = new ParticipantResponseMapper();
            var participants = conference.Participants
                .Select(x => participantMapper.MapParticipantToResponseModel(x))
                .ToList();
            
            var response = new ConferenceResponse
            {
                Id = conference.Id.GetValueOrDefault(),
                CaseName = conference.Case_name,
                CaseNumber = conference.Case_number,
                CaseType = conference.Case_type,
                ScheduledDateTime = conference.Scheduled_date_time.GetValueOrDefault(),
                Status = status,
                Participants = participants
            };

            return response;
        }
    }
}