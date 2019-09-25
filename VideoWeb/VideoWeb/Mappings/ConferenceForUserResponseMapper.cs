using System;
using System.Collections.Generic;
using System.Linq;
using VideoWeb.Contract.Responses;
using VideoWeb.Services.Video;
using ConferenceUserRole = VideoWeb.Services.Video.UserRole;
using UserRole = VideoWeb.Contract.Responses.UserRole;

namespace VideoWeb.Mappings
{
    public class ConferenceForUserResponseMapper
    {
        public ConferenceForUserResponse MapConferenceSummaryToResponseModel(ConferenceSummaryResponse conference)
        {
            var conferenceForUserResponse = new ConferenceForUserResponse();

            
            if (conference.Participants != null)
            {
                var participantStatusRoles = new List<ConferenceUserRole>
                {
                    ConferenceUserRole.Individual, ConferenceUserRole.Representative
                };
                var filteredParticipants = conference.Participants
                    .Where(x => participantStatusRoles.Contains(x.User_role.GetValueOrDefault())).ToList();

                conferenceForUserResponse.NoOfParticipantsAvailable =
                    filteredParticipants.Count(x => x.Status == ParticipantState.Available);

                conferenceForUserResponse.NoOfParticipantsInConsultation =
                    filteredParticipants.Count(x => x.Status == ParticipantState.InConsultation);

                conferenceForUserResponse.NoOfParticipantsUnavailable =
                    filteredParticipants.Count(x =>
                        (x.Status != ParticipantState.InConsultation && x.Status != ParticipantState.Available));

                conferenceForUserResponse.Participants = MapParticipants(conference.Participants);
            }
            
            conferenceForUserResponse.Id = conference.Id.GetValueOrDefault();
            conferenceForUserResponse.CaseName = conference.Case_name;
            conferenceForUserResponse.CaseNumber = conference.Case_number;
            conferenceForUserResponse.CaseType = conference.Case_type;
            conferenceForUserResponse.ScheduledDateTime = conference.Scheduled_date_time.GetValueOrDefault();
            conferenceForUserResponse.ScheduledDuration = conference.Scheduled_duration.GetValueOrDefault();
            conferenceForUserResponse.Status = MapConferenceStatus(conference.Status);
            conferenceForUserResponse.NoOfPendingTasks = conference.Pending_tasks.GetValueOrDefault();

            return conferenceForUserResponse;
        }

        public List<ParticipantForUserResponse> MapParticipants(List<ParticipantSummaryResponse> participants)
        {
            var participantSummaryList = new List<ParticipantForUserResponse>();

            foreach (var participant in participants)
            {
                var participantResponse = new ParticipantForUserResponse
                {
                    Username = participant.Username,
                    DisplayName = participant.Display_name,
                    Status = MapParticipantStatus(participant.Status),
                    Role = Enum.Parse<UserRole>(participant.User_role.ToString()),
                    Representee = string.IsNullOrWhiteSpace(participant.Representee) ? null : participant.Representee,
                    CaseTypeGroup = participant.Case_group
                };
                participantSummaryList.Add(participantResponse);
            }

            return participantSummaryList;
        }

        private static ConferenceStatus MapConferenceStatus(ConferenceState? conferenceState)
        {
            switch (conferenceState)
            {
                case ConferenceState.NotStarted: return ConferenceStatus.NotStarted;
                case ConferenceState.InSession: return ConferenceStatus.InSession;
                case ConferenceState.Paused: return ConferenceStatus.Paused;
                case ConferenceState.Suspended: return ConferenceStatus.Suspended;
                case ConferenceState.Closed: return ConferenceStatus.Closed;
                default: return ConferenceStatus.NotStarted;
            }
        }

        public ParticipantStatus MapParticipantStatus(ParticipantState? value)
        {
            switch (value)
            {
                case ParticipantState.None: return ParticipantStatus.None;
                case ParticipantState.NotSignedIn: return ParticipantStatus.NotSignedIn;
                case ParticipantState.UnableToJoin: return ParticipantStatus.UnableToJoin;
                case ParticipantState.Joining: return ParticipantStatus.Joining;
                case ParticipantState.Available: return ParticipantStatus.Available;
                case ParticipantState.InHearing: return ParticipantStatus.InHearing;
                case ParticipantState.InConsultation: return ParticipantStatus.InConsultation;
                case ParticipantState.Disconnected: return ParticipantStatus.Disconnected;
                default: return ParticipantStatus.None;
            }
        }
    }
}
