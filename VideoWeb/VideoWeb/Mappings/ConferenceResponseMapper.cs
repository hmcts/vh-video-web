using System;
using System.Collections.Generic;
using System.Linq;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Services.Video;
using UserRole = VideoWeb.Services.Video.UserRole;

namespace VideoWeb.Mappings
{
    public static class ConferenceResponseMapper
    {
        public static ConferenceResponse MapConferenceDetailsToResponseModel(ConferenceDetailsResponse conference)
        {
            var response = new ConferenceResponse
            {
                Id = conference.Id,
                CaseName = conference.Case_name,
                CaseNumber = conference.Case_number,
                CaseType = conference.Case_type,
                ScheduledDateTime = conference.Scheduled_date_time,
                ScheduledDuration = conference.Scheduled_duration,
                Status = GetStatus(conference.Current_status),
                Participants = MapParticipants(conference),
                ClosedDateTime = conference.Closed_date_time,
                HearingVenueName = conference.Hearing_venue_name,
                AudioRecordingRequired = conference.Audio_recording_required,
                HearingRefId = conference.Hearing_id,
                Endpoints = MapEndpoints(conference)
            };

            if (conference.Meeting_room != null)
            {

                response.ParticipantUri = conference.Meeting_room.Participant_uri;
                response.PexipNodeUri = conference.Meeting_room.Pexip_node;
                response.PexipSelfTestNodeUri = conference.Meeting_room.Pexip_self_test_node;

                var tiledParticipants = GetNotJudgeParticipant(conference);

                if (tiledParticipants.Count > 4)
                {
                    // If the number of participants is more than 4, then simply increment the tile numbers
                    TiledParticipantGreaterThanFour(response.Participants);
                }
                else
                {
                    TiledParticipants(response.Participants, tiledParticipants);
                }
            }

            return response;
        }

        private static ConferenceStatus GetStatus(ConferenceState state)
        {
            if (!Enum.TryParse(state.ToString(), true, out ConferenceStatus status))
            {
                status = ConferenceStatus.NotStarted;
            }

            return status;
        }

        private static string GetTiledDisplayName(ParticipantResponse participant, int position)
        {
            return $"T{position};{participant.DisplayName};{participant.Id}";
        }

        private static List<ParticipantResponse> MapParticipants(ConferenceDetailsResponse conference)
        {
            conference.Participants ??= new List<ParticipantDetailsResponse>();
            return conference.Participants
                .OrderBy(x => x.Case_type_group)
                .Select(x => ParticipantResponseMapper.MapParticipantToResponseModel(x))
                .ToList();
        }

        private static List<VideoEndpointResponse> MapEndpoints(ConferenceDetailsResponse conference)
        {
            conference.Endpoints ??= new List<EndpointResponse>();
            return conference.Endpoints.Select(x => EndpointsResponseMapper.Map(x)).ToList();
        }

        private static List<ParticipantDetailsResponse> GetNotJudgeParticipant(ConferenceDetailsResponse conference)
        {
            return conference.Participants.Where(x =>
             x.User_role == UserRole.Individual || x.User_role == UserRole.Representative).ToList();
        }

        private static void TiledParticipantGreaterThanFour(List<ParticipantResponse> participants)
        {
            // If the number of participants is more than 4, then simply increment the tile numbers
            var position = 1;
            foreach (var participant in participants)
            {
                if (participant.Role == Role.Judge)
                {
                    participant.TiledDisplayName = GetTiledDisplayName(participant, 0);
                }
                else
                {
                    participant.TiledDisplayName = GetTiledDisplayName(participant, position);
                    position++;
                }
            }
        }

        private static void TiledParticipants(List<ParticipantResponse> participants, List<ParticipantDetailsResponse> tiledParticipants)
        {
            var partyGroups = tiledParticipants.GroupBy(x => x.Case_type_group).ToList();
            foreach (var group in partyGroups)
            {
                var pats = group.ToList();
                var position = partyGroups.IndexOf(group) + 1;
                foreach (var p in pats)
                {
                    var participant = participants.Find(x => x.Id == p.Id);
                    participant.TiledDisplayName = GetTiledDisplayName(participant, position);
                    position += 2;
                }
            }
        }

    }
}
