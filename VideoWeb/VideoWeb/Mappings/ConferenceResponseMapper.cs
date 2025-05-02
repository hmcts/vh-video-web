using System.Collections.Generic;
using System.Linq;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Helpers;

namespace VideoWeb.Mappings;

public static class ConferenceResponseMapper
{
    public static ConferenceResponse Map(Conference conference)
    {
        var response = new ConferenceResponse
        {
            Id = conference.Id,
            CaseName = conference.CaseName,
            CaseNumber = conference.CaseNumber,
            CaseType = conference.CaseType,
            ScheduledDateTime = conference.ScheduledDateTime,
            ScheduledDuration = conference.ScheduledDuration,
            Status = conference.CurrentStatus,
            Participants = MapParticipants(conference),
            ClosedDateTime = conference.ClosedDateTime,
            HearingVenueName = conference.HearingVenueName,
            AudioRecordingRequired = conference.AudioRecordingRequired,
            HearingRefId = conference.HearingId,
            Endpoints = conference.Endpoints?.Select(VideoEndpointsResponseMapper.Map).ToList(),
            HearingVenueIsScottish = conference.IsScottish,
            IngestUrl = conference.IngestUrl,
            Supplier = conference.Supplier,
            AllocatedCso = conference.AllocatedCso,
            AllocatedCsoId = conference.AllocatedCsoId,
            AllocatedCsoUsername = conference.AllocatedCsoUsername,
            CountdownCompleted = conference.CountdownComplete
        };
        
        if (conference.MeetingRoom != null)
        {
            response.ParticipantUri = conference.MeetingRoom.ParticipantUri;
            response.PexipNodeUri = conference.MeetingRoom.PexipNode;
            response.PexipSelfTestNodeUri = conference.MeetingRoom.PexipSelfTest;
            ParticipantTilePositionHelper.AssignTilePositions(response.Participants);
        }
        
        return response;
    }
    
    private static List<ParticipantResponse> MapParticipants(Conference conference)
    {
        conference.Participants ??= new List<Participant>();
        return conference.Participants
            .OrderBy(x => x.Role)
            .Select(ParticipantDtoForResponseMapper.Map)
            .ToList();
    }
}
