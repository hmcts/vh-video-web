using System.Collections.Generic;
using System.Linq;
using VideoWeb.Contract.Responses;
using VideoWeb.Helpers;
using VideoWeb.Mappings.Interfaces;
using VideoWeb.Common.Models;

namespace VideoWeb.Mappings
{
    public class ConferenceResponseMapper(
        IMapTo<ParticipantDto, ParticipantResponse> participantResponseMapper,
        IMapTo<EndpointDto, VideoEndpointResponse> videoEndpointResponseMapper) : IMapTo<ConferenceDto, ConferenceResponse>
    {
        public ConferenceResponse Map(ConferenceDto conferenceDto)
        {
            var response = new ConferenceResponse
            {
                Id = conferenceDto.Id,
                CaseName = conferenceDto.CaseName,
                CaseNumber = conferenceDto.CaseNumber,
                CaseType = conferenceDto.CaseType,
                ScheduledDateTime = conferenceDto.ScheduledDateTime,
                ScheduledDuration = conferenceDto.ScheduledDuration,
                Status = ConferenceHelper.GetConferenceStatus(conferenceDto.CurrentStatus),
                Participants = MapParticipants(conferenceDto),
                ClosedDateTime = conferenceDto.ClosedDateTime,
                HearingVenueName = conferenceDto.HearingVenueName,
                AudioRecordingRequired = conferenceDto.AudioRecordingRequired,
                HearingRefId = conferenceDto.HearingId,
                Endpoints = conferenceDto.Endpoints?.Select(videoEndpointResponseMapper.Map).ToList(),
                HearingVenueIsScottish = conferenceDto.IsScottish,
                IngestUrl = conferenceDto.IngestUrl
            };

            if (conferenceDto.MeetingRoom != null)
            {
                response.ParticipantUri = conferenceDto.MeetingRoom.ParticipantUri;
                response.PexipNodeUri = conferenceDto.MeetingRoom.PexipNode;
                response.PexipSelfTestNodeUri = conferenceDto.MeetingRoom.PexipSelfTest;
                ParticipantTilePositionHelper.AssignTilePositions(response.Participants);
            }

            return response;
        }

        private List<ParticipantResponse> MapParticipants(ConferenceDto conferenceDto)
        {
            conferenceDto.Participants ??= new List<ParticipantDto>();
            return conferenceDto.Participants
                .OrderBy(x => x.CaseTypeGroup)
                .Select(participantResponseMapper.Map)
                .ToList();
        }
    }
}
