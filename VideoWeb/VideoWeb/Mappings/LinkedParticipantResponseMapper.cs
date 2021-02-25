using LinkedParticipantResponse = VideoWeb.Services.Video.LinkedParticipantResponse;

namespace VideoWeb.Mappings
{
    public class LinkedParticipantResponseMapper: IMapTo<LinkedParticipantResponse, VideoWeb.Contract.Responses.LinkedParticipantResponse>
    {
        public VideoWeb.Contract.Responses.LinkedParticipantResponse Map(LinkedParticipantResponse participant)
        {
            return new VideoWeb.Contract.Responses.LinkedParticipantResponse
            {
                ParticipantId = participant.Participant_id,
                LinkedParticipantId = participant.Linked_id,
                Type = participant.Type
            };
        }
    }
}
