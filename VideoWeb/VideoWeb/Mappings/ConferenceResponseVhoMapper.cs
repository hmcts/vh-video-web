using System.Linq;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Helpers;

namespace VideoWeb.Mappings;

public static class ConferenceResponseVhoMapper{
    
    public static ConferenceResponseVho Map(Conference conference)
    {
        var response = new ConferenceResponseVho
        {
            Id = conference.Id,
            CaseName = conference.CaseName,
            CaseNumber = conference.CaseNumber,
            CaseType = conference.CaseType,
            ScheduledDateTime = conference.ScheduledDateTime,
            ScheduledDuration = conference.ScheduledDuration,
            Status = ConferenceHelper.GetConferenceStatus(conference.CurrentStatus),
            Participants = conference.Participants.Select(ParticipantResponseForVhoMapper.Map).ToList(),
            ClosedDateTime = conference.ClosedDateTime,
            HearingVenueName = conference.HearingVenueName,
            HearingId = conference.HearingId
        };
        
        if (conference.MeetingRoom == null) return response;
        
        response.AdminIFrameUri = conference.MeetingRoom.AdminUri;
        response.ParticipantUri = conference.MeetingRoom.ParticipantUri;
        response.PexipNodeUri = conference.MeetingRoom.PexipNode;
        
        AssignTilePositions(conference, response);
        
        return response;
    }
    
    private static void AssignTilePositions(Conference conference, ConferenceResponseVho response)
    {
        var tiledParticipants = conference.Participants.Where(x =>
            x.Role == Role.Individual || x.Role == Role.Representative).ToList();
        
        var partyGroups = tiledParticipants.GroupBy(x => x.Role).ToList();
        foreach (var group in partyGroups)
        {
            var pats = @group.ToList();
            var position = partyGroups.IndexOf(@group) + 1;
            foreach (var p in pats)
            {
                var participant = response.Participants.Find(x => x.Id == p.Id);
                participant.TiledDisplayName = $"T{position};{participant.DisplayName};{participant.Id}";
                position += 2;
            }
        }
    }
}
