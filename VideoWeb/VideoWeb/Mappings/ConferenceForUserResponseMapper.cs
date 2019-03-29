using System;
using System.Collections.Generic;
using System.Linq;
using VideoWeb.Contract.Responses;
using VideoWeb.Services.Video;
using ConferenceState = VideoWeb.Common.Enums.ConferenceState;

namespace VideoWeb.Mappings
{
    public class ConferenceForUserResponseMapper
    {
        public ConferenceForUserResponse MapConferenceSummaryToResponseModel(ConferenceSummaryResponse conference)
        {
            ConferenceForUserResponse conferenceForUserResponse = new ConferenceForUserResponse();
            var participantsByGroups = conference.Participants.GroupBy(x => x.Status);
            foreach (var participantsByGroup in participantsByGroups)
            {
                switch (ToLocal(participantsByGroup.Key))
                {
                    case ParticipantStatus.None:
                        conferenceForUserResponse.NoOfParticipantsNone = participantsByGroup.Count();
                        break;
                    case ParticipantStatus.NotSignedIn:
                        conferenceForUserResponse.NoOfParticipantsNotSignedIn= participantsByGroup.Count();
                        break;
                    case ParticipantStatus.UnableToJoin:
                        conferenceForUserResponse.NoOfParticipantsUnableToJoin= participantsByGroup.Count();
                        break;
                    case ParticipantStatus.Joining:
                        conferenceForUserResponse.NoOfParticipantsJoining= participantsByGroup.Count();
                        break;
                    case ParticipantStatus.Available:
                        conferenceForUserResponse.NoOfParticipantsAvailable= participantsByGroup.Count();
                        break;
                    case ParticipantStatus.InHearing:
                        conferenceForUserResponse.NoOfParticipantsInHearing= participantsByGroup.Count();
                        break;
                    case ParticipantStatus.InConsultation:
                        conferenceForUserResponse.NoOfParticipantsInConsultation= participantsByGroup.Count();
                        break;
                    case ParticipantStatus.Disconnected:
                        conferenceForUserResponse.NoOfParticipantsDisconnected = participantsByGroup.Count();
                        break;
                }
            }

            conferenceForUserResponse.Id = conference.Id.GetValueOrDefault();
            conferenceForUserResponse.CaseName = conference.Case_name;
            conferenceForUserResponse.CaseNumber = conference.Case_number;
            conferenceForUserResponse.CaseType = conference.Case_type;
            conferenceForUserResponse.ScheduledDateTime = conference.Scheduled_date_time.GetValueOrDefault();
            conferenceForUserResponse.ScheduledDuration = conference.Scheduled_duration;
            conferenceForUserResponse.Status = (ConferenceState?)conference.Status;
            conferenceForUserResponse.Participants = MapParticipants(conference.Participants);

            return conferenceForUserResponse;
        }

        private static List<Contract.Responses.ParticipantSummaryResponse> MapParticipants(List<Services.Video.ParticipantSummaryResponse> participants)
        {
            var participantSummaryList = new List<Contract.Responses.ParticipantSummaryResponse>();

            foreach (var participant in participants)
            {
                var participantSummaryResponse = new Contract.Responses.ParticipantSummaryResponse
                {
                    Username = participant.Username,
                    Status = (ParticipantState)participant.Status,
                    Role = participant.Role
                };
                participantSummaryList.Add(participantSummaryResponse);
            }

            return participantSummaryList;
        }
       
        public static ParticipantStatus ToLocal(ParticipantState? value)
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
            }
            return ParticipantStatus.None;
        }
    }
}
