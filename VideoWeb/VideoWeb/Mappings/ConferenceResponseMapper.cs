using System.Collections.Generic;
using System.Linq;
using VideoWeb.Contract.Responses;
using VideoWeb.Helpers;
using VideoWeb.Mappings.Interfaces;
using VideoApi.Contract.Responses;

namespace VideoWeb.Mappings
{
    public class ConferenceResponseMapper : IMapTo<ConferenceDetailsResponse, ConferenceResponse>
    {
        private readonly IMapTo<ParticipantDetailsResponse, ParticipantResponse> _participantResponseMapper;

        private readonly IMapTo<EndpointResponse, int, VideoEndpointResponse> _videoEndpointResponseMapper;

        public const string Aberdeen = "Aberdeen Tribunal Hearing Centre";
        public const string Dundee = "Dundee Tribunal Hearing Centre";
        public const string Edinburgh = "Edinburgh Employment Tribunal";
        public const string Glasgow = "Glasgow Tribunals Centre";
        public const string Inverness = "Inverness Employment Tribunal";

        private readonly List<string> ScottishHearingVenues = new List<string> { Aberdeen, Dundee, Edinburgh, Glasgow, Inverness };

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
                Endpoints = MapEndpoints(conference),
                HearingVenueIsScottish = ScottishHearingVenues.Any(venueName => venueName == conference.HearingVenueName)
            };

            if (conference.MeetingRoom != null)
            {

                response.ParticipantUri = conference.MeetingRoom.ParticipantUri;
                response.PexipNodeUri = conference.MeetingRoom.PexipNode;
                response.PexipSelfTestNodeUri = conference.MeetingRoom.PexipSelfTestNode;

                ParticipantTilePositionHelper.AssignTilePositions(response.Participants);
            }

            return response;
        }

        private List<ParticipantResponse> MapParticipants(ConferenceDetailsResponse conference)
        {
            conference.Participants ??= new List<ParticipantDetailsResponse>();
            return conference.Participants
                .OrderBy(x => x.CaseTypeGroup)
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
