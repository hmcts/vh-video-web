using System.Collections.Generic;
using System.Linq;
using VideoWeb.Contract.Responses;
using VideoWeb.Helpers;
using VideoWeb.Mappings.Interfaces;
using VideoWeb.Common.Models;

namespace VideoWeb.Mappings
{
    public class ConferenceResponseMapper(
        IMapTo<Participant, ParticipantResponse> participantResponseMapper,
        IMapTo<Endpoint, VideoEndpointResponse> videoEndpointResponseMapper) : IMapTo<Conference, ConferenceResponse>
    {
        public ConferenceResponse Map(Conference conference)
        {
            var response = new ConferenceResponse
            {
                Id = conference.Id,
                CaseName = conference.CaseName,
                CaseNumber = conference.CaseNumber,
                CaseType = conference.CaseType,
                ScheduledDateTime = conference.ScheduledDateTime,
                ScheduledDuration = conference.ScheduledDuration,
                Status = ConferenceHelper.GetConferenceStatus(conference.CurrentStatus),
                Participants = MapParticipants(conference),
                ClosedDateTime = conference.ClosedDateTime,
                HearingVenueName = conference.HearingVenueName,
                AudioRecordingRequired = conference.AudioRecordingRequired,
                HearingRefId = conference.HearingId,
                Endpoints = conference.Endpoints?.Select(videoEndpointResponseMapper.Map).ToList(),
                HearingVenueIsScottish = conference.IsScottish,
                IngestUrl = conference.IngestUrl
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

        private List<ParticipantResponse> MapParticipants(Conference conference)
        {
            conference.Participants ??= new List<Participant>();
            return conference.Participants
                .OrderBy(x => x.CaseTypeGroup)
                .Select(participantResponseMapper.Map)
                .ToList();
        }
    }
}
