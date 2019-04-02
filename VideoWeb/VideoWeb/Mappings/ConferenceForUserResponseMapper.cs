using System.Collections.Generic;
using System.Linq;
using VideoWeb.Contract.Responses;
using VideoWeb.Services.Video;

namespace VideoWeb.Mappings
{
    public class ConferenceForUserResponseMapper
    {
        public ConferenceForUserResponse MapConferenceSummaryToResponseModel(ConferenceSummaryResponse conference)
        {
            var conferenceForUserResponse = new ConferenceForUserResponse();

            if (conference.Participants != null)
            {
                conferenceForUserResponse.NoOfParticipantsAvailable =
                    conference.Participants.Count(x => x.Status == ParticipantState.Available);

                conferenceForUserResponse.NoOfParticipantsInConsultation =
                    conference.Participants.Count(x => x.Status == ParticipantState.InConsultation);

                conferenceForUserResponse.NoOfParticipantsUnavailable =
                    conference.Participants.Count(x =>
                        x.Status != ParticipantState.InConsultation || x.Status == ParticipantState.Available);

                conferenceForUserResponse.Participants = MapParticipants(conference.Participants);
            }

            conferenceForUserResponse.Id = conference.Id.GetValueOrDefault();
            conferenceForUserResponse.CaseName = conference.Case_name;
            conferenceForUserResponse.CaseNumber = conference.Case_number;
            conferenceForUserResponse.CaseType = conference.Case_type;
            conferenceForUserResponse.ScheduledDateTime = conference.Scheduled_date_time.GetValueOrDefault();
            conferenceForUserResponse.ScheduledDuration = conference.Scheduled_duration;
            conferenceForUserResponse.Status = MapConferenceStatus(conference.Status);

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
                    Status = MaParticipantStatus(participant.Status),
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

        private static ParticipantStatus MaParticipantStatus(ParticipantState? value)
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
