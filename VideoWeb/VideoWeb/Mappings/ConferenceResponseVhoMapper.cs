using System.Collections.Generic;
using System.Linq;
using VideoWeb.Contract.Responses;
using VideoWeb.Helpers;
using VideoWeb.Mappings.Interfaces;
using VideoApi.Contract.Responses;
using VideoApi.Contract.Enums;
using ParticipantResponse = VideoApi.Contract.Responses.ParticipantResponse;

namespace VideoWeb.Mappings
{
    public class ConferenceResponseVhoMapper : IMapTo<ConferenceDetailsResponse, ConferenceResponseVho>
    {
        private readonly IMapTo<ParticipantResponse, ParticipantResponseVho> _participantResponseVhoMapper;

        public ConferenceResponseVhoMapper(IMapTo<ParticipantResponse, ParticipantResponseVho> participantResponseVhoMapper)
        {
            _participantResponseVhoMapper = participantResponseVhoMapper;
        }

        public ConferenceResponseVho Map(ConferenceDetailsResponse conference)
        {

            conference.Participants ??= new List<ParticipantResponse>();

            var participants = conference.Participants
                .OrderBy(x => x.UserRole)
                .Select(_participantResponseVhoMapper.Map)
                .ToList();

            var response = new ConferenceResponseVho
            {
                Id = conference.Id,
                CaseName = conference.CaseName,
                CaseNumber = conference.CaseNumber,
                CaseType = conference.CaseType,
                ScheduledDateTime = conference.ScheduledDateTime,
                ScheduledDuration = conference.ScheduledDuration,
                Status = ConferenceHelper.GetConferenceStatus(conference.CurrentStatus),
                Participants = participants,
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

        private void AssignTilePositions(ConferenceDetailsResponse conference, ConferenceResponseVho response)
        {
            var tiledParticipants = conference.Participants.Where(x =>
                x.UserRole == UserRole.Individual || x.UserRole == UserRole.Representative).ToList();

            var partyGroups = tiledParticipants.GroupBy(x => x.UserRole).ToList();
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
}
