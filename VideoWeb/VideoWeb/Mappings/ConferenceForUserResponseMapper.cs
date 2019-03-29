using System.Collections.Generic;
using VideoWeb.Contract.Responses;
using VideoWeb.Services.Video;
using ConferenceState = VideoWeb.Common.Enums.ConferenceState;

namespace VideoWeb.Mappings
{
    public class ConferenceForUserResponseMapper
    {
        public ConferenceForUserResponse MapConferenceSummaryToResponseModel(ConferenceSummaryResponse conference)
        {
            return new ConferenceForUserResponse
            {
                Id = conference.Id.GetValueOrDefault(),
                CaseName = conference.Case_name,
                CaseNumber = conference.Case_number,
                CaseType = conference.Case_type,
                ScheduledDateTime = conference.Scheduled_date_time.GetValueOrDefault(),
                ScheduledDuration = conference.Scheduled_duration,
                Status = (ConferenceState?) conference.Status,
                Participants = MapParticipants(conference.Participants)
            };
        }

        private static List<Contract.Responses.ParticipantSummaryResponse> MapParticipants(List<Services.Video.ParticipantSummaryResponse> participants)
        {
            var participantSummaryList= new List<Contract.Responses.ParticipantSummaryResponse>();
            foreach (var participant in participants)
            {
                var participantSummaryResponse = new Contract.Responses.ParticipantSummaryResponse
                {
                    
                    Username = participant.Username,
                    Status =  (ParticipantState) participant.Status,
                    Role = participant.Role
                };

                participantSummaryList.Add(participantSummaryResponse);
            }
            return participantSummaryList;
        }
    }
}