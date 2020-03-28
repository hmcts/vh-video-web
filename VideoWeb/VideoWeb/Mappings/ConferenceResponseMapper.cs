using System;
using System.Collections.Generic;
using System.Linq;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Services.Video;
using BookingParticipant = VideoWeb.Services.Bookings.ParticipantResponse;
using UserRole = VideoWeb.Services.Video.UserRole;

namespace VideoWeb.Mappings
{
    public static class ConferenceResponseMapper
    {
        public static ConferenceResponse MapConferenceDetailsToResponseModel(ConferenceDetailsResponse conference,
            IEnumerable<BookingParticipant> bookingParticipants)
        {
            if (!Enum.TryParse(conference.Current_status.ToString(), true, out ConferenceStatus status))
            {
                status = ConferenceStatus.NotStarted;
            }

            conference.Participants ??= new List<ParticipantDetailsResponse>();
            
                var participants = conference.Participants
                    .OrderBy(x => x.Case_type_group)
                    .Select(x =>
                        ParticipantResponseMapper
                            .MapParticipantToResponseModel(x, bookingParticipants.SingleOrDefault(p => x.Ref_id == p.Id)))
                    .ToList();
            
            var response = new ConferenceResponse
            {
                Id = conference.Id,
                CaseName = conference.Case_name,
                CaseNumber = conference.Case_number,
                CaseType = conference.Case_type,
                ScheduledDateTime = conference.Scheduled_date_time,
                ScheduledDuration = conference.Scheduled_duration,
                Status = status,
                Participants = participants,
                ClosedDateTime = conference.Closed_date_time,
                HearingVenueName = conference.Hearing_venue_name
            };

            if (conference.Meeting_room == null) return response;

            response.AdminIFrameUri = conference.Meeting_room.Admin_uri;
            response.JudgeIFrameUri = conference.Meeting_room.Judge_uri;
            response.ParticipantUri = conference.Meeting_room.Participant_uri;
            response.PexipNodeUri = conference.Meeting_room.Pexip_node;
            response.PexipSelfTestNodeUri = conference.Meeting_room.Pexip_self_test_node;

            var tiledParticipants = conference.Participants.Where(x =>
                x.User_role == UserRole.Individual || x.User_role == UserRole.Representative).ToList();

            var partyGroups = tiledParticipants.GroupBy(x => x.Case_type_group).ToList();
            foreach (var group in partyGroups)
            {
                var pats = group.ToList();
                var position = partyGroups.IndexOf(group) + 1;
                foreach (var p in pats)
                {
                    var participant = response.Participants.Find(x => x.Id == p.Id);
                    participant.TiledDisplayName = $"T{position};{participant.DisplayName};{participant.Id}";
                    position += 2;
                }
            }

            return response;
        }
    }
}
