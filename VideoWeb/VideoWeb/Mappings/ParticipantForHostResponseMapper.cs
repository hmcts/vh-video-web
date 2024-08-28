using VideoApi.Contract.Responses;
using ParticipantForHostResponse = VideoWeb.Contract.Responses.ParticipantForHostResponse;

namespace VideoWeb.Mappings;

public static class ParticipantForHostResponseMapper
{
    public static ParticipantForHostResponse Map(ParticipantResponse participant)
    {
        return new ParticipantForHostResponse
        {
            Id = participant.Id,
            DisplayName = participant.DisplayName,
        };
    }
    
    /// <summary>
    /// TODO: Delete mapper once V1 apis are removed
    /// </summary>
    /// <param name="participant"></param>
    /// <returns></returns>
    public static ParticipantForHostResponse Map(BookingsApi.Contract.V1.Responses.ParticipantResponse participant)
    {
        return new ParticipantForHostResponse
        {
            Id = participant.Id,
            DisplayName = participant.DisplayName,
        };
    }
    
    
    public static ParticipantForHostResponse Map(BookingsApi.Contract.V2.Responses.ParticipantResponseV2 participant)
    {
        return new ParticipantForHostResponse
        {
            Id = participant.Id,
            DisplayName = participant.DisplayName,
        };
    }
}
