using System;
using System.Collections.Generic;
using System.Linq;
using VideoWeb.Contract.Responses;
using VideoWeb.Services.Video;
using ConferenceUserRole = VideoWeb.Services.Video.UserRole;

namespace VideoWeb.Mappings
{
    public class ConferenceForUserResponseMapper
    {
        public ConferenceForUserResponse MapConferenceSummaryToResponseModel(ConferenceSummaryResponse conference)
        {
            return MapConferenceSummaryToResponseModel<ConferenceForUserResponse>(conference);
        }
        
        public T MapConferenceSummaryToResponseModel<T>(ConferenceSummaryResponse conference) where T:ConferenceForUserResponse, new()
        {
            var conferenceForUserResponse = new T();

            var participantMapper = new ParticipantForUserResponseMapper();

            if (conference.Participants != null)
            {
                var participantStatusRoles = new List<ConferenceUserRole>
                {
                    ConferenceUserRole.Individual, ConferenceUserRole.Representative
                };
                var filteredParticipants = conference.Participants
                    .Where(x => participantStatusRoles.Contains(x.User_role)).ToList();

                conferenceForUserResponse.NoOfParticipantsAvailable =
                    filteredParticipants.Count(x => x.Status == ParticipantState.Available);

                conferenceForUserResponse.NoOfParticipantsInConsultation =
                    filteredParticipants.Count(x => x.Status == ParticipantState.InConsultation);

                conferenceForUserResponse.NoOfParticipantsUnavailable =
                    filteredParticipants.Count(x =>
                        (x.Status != ParticipantState.InConsultation && x.Status != ParticipantState.Available));

                conferenceForUserResponse.Participants = participantMapper.MapParticipants(conference.Participants);
            }

            if (conference.Tasks != null)
            {
                var conferenceTasks = conference.Tasks.Select(x => { return new TaskUserResponse { Id = x.Id, Body = x.Body }; }).ToList();
                conferenceForUserResponse.Tasks = conferenceTasks;
            }

            conferenceForUserResponse.Id = conference.Id;
            conferenceForUserResponse.CaseName = conference.Case_name;
            conferenceForUserResponse.CaseNumber = conference.Case_number;
            conferenceForUserResponse.CaseType = conference.Case_type;
            conferenceForUserResponse.ScheduledDateTime = conference.Scheduled_date_time;
            conferenceForUserResponse.ScheduledDuration = conference.Scheduled_duration;
            conferenceForUserResponse.Status = Enum.Parse<ConferenceStatus>(conference.Status.ToString());
            conferenceForUserResponse.NoOfPendingTasks = conference.Pending_tasks;
            conferenceForUserResponse.HearingVenueName = conference.Hearing_venue_name;

            return conferenceForUserResponse;
        }
    }
}
