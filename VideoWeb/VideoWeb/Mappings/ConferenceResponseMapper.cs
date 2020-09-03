using System;
using System.Collections.Generic;
using System.Linq;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Helpers;
using VideoWeb.Services.Video;
using UserRole = VideoWeb.Services.Video.UserRole;

namespace VideoWeb.Mappings
{
    public static class ConferenceResponseMapper
    {
        public static ConferenceResponse MapConferenceDetailsToResponseModel(ConferenceDetailsResponse conference)
        {
            if (!Enum.TryParse(conference.Current_status.ToString(), true, out ConferenceStatus status))
            {
                status = ConferenceStatus.NotStarted;
            }

            conference.Participants ??= new List<ParticipantDetailsResponse>();

            var participants = conference.Participants
                .OrderBy(x => x.Case_type_group)
                .Select(x => ParticipantResponseMapper.MapParticipantToResponseModel(x))
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
                HearingVenueName = conference.Hearing_venue_name,
                AudioRecordingRequired = conference.Audio_recording_required,
                HearingRefId = conference.Hearing_id
            };

            if (conference.Meeting_room == null) return response;

            response.ParticipantUri = conference.Meeting_room.Participant_uri;
            response.PexipNodeUri = conference.Meeting_room.Pexip_node;
            response.PexipSelfTestNodeUri = conference.Meeting_room.Pexip_self_test_node;

            ParticipantTilePositionHelper.AssignTilePositions(response.Participants);

            return response;
        }
    }
}
