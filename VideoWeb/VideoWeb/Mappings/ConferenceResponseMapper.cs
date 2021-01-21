using System.Collections.Generic;
using System.Linq;
using VideoWeb.Contract.Responses;
using VideoWeb.Helpers;
using VideoWeb.Services.Video;

namespace VideoWeb.Mappings
{
    public class ConferenceResponseMapper : IMapTo<ConferenceDetailsResponse, ConferenceResponse>
    {
        private readonly IMapTo<ParticipantDetailsResponse, ParticipantResponse> _participantResponseMapper;

        private readonly IMapTo<EndpointResponse, int, VideoEndpointResponse> _videoEndpointResponseMapper;

        public ConferenceResponseMapper(IMapTo<ParticipantDetailsResponse, ParticipantResponse> participantResponseMapper, IMapTo<EndpointResponse, int, VideoEndpointResponse> videoEndpointResponseMapper)
        {
            _participantResponseMapper = participantResponseMapper;
            _videoEndpointResponseMapper = videoEndpointResponseMapper;
        }

        public ConferenceResponse Map(ConferenceDetailsResponse conference)
        {
            var response = new ConferenceResponse
            {
                Id = conference.Id,
                CaseName = conference.Case_name,
                CaseNumber = conference.Case_number,
                CaseType = conference.Case_type,
                ScheduledDateTime = conference.Scheduled_date_time,
                ScheduledDuration = conference.Scheduled_duration,
                Status = ConferenceHelper.GetConferenceStatus(conference.Current_status),
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

                ParticipantTilePositionHelper.AssignTilePositions(response.Participants);
            }

            return response;
        }

        private List<ParticipantResponse> MapParticipants(ConferenceDetailsResponse conference)
        {
            conference.Participants ??= new List<ParticipantDetailsResponse>();
            return conference.Participants
                .OrderBy(x => x.Case_type_group)
                .Select(_participantResponseMapper.Map)
                .ToList();
        }

        private List<VideoEndpointResponse> MapEndpoints(ConferenceDetailsResponse conference)
        {
            conference.Endpoints ??= new List<EndpointResponse>();
            return conference.Endpoints.Select(_videoEndpointResponseMapper.Map).ToList();
        }
    }
}
