using System.Linq;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;

namespace VideoWeb.Mappings;

public static class ConferenceResponseVhoMapper{
    
    public static ConferenceResponseVho Map(Conference conference)
    {
        var response = new ConferenceResponseVho();
        response.Id = conference.Id;
        response.CaseName = conference.CaseName;
        response.CaseNumber = conference.CaseNumber;
        response.CaseType = conference.CaseType;
        response.ScheduledDateTime = conference.ScheduledDateTime;
        response.ScheduledDuration = conference.ScheduledDuration;
        response.Status = conference.CurrentStatus;
        response.ClosedDateTime = conference.ClosedDateTime;
        response.HearingVenueName = conference.HearingVenueName;
        response.HearingId = conference.HearingId;
        
        if (conference.Participants != null)
        {
            response.Participants = conference.Participants.Select(ParticipantResponseForVhoMapper.Map).ToList();
            AssignTilePositions(conference, response);
        }
        
        if (conference.MeetingRoom == null) return response;
        
        response.AdminIFrameUri = conference.MeetingRoom.AdminUri;
        response.ParticipantUri = conference.MeetingRoom.ParticipantUri;
        response.PexipNodeUri = conference.MeetingRoom.PexipNode;
        

        
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
