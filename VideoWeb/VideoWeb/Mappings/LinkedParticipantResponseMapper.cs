using System;
using VideoWeb.Common.Models;
using LinkedParticipantResponse = VideoWeb.Contract.Responses.LinkedParticipantResponse;
using VHLinkedParticipantResponse = VideoApi.Contract.Responses.LinkedParticipantResponse;


namespace VideoWeb.Mappings;

public static class LinkedParticipantResponseMapper
{
    /// <summary>
    /// Mapped from DTO to response
    /// </summary>
    /// <param name="input">LinkedParticipant</param>
    /// <returns></returns>
    public static LinkedParticipantResponse Map(LinkedParticipant input)
    {
        return new LinkedParticipantResponse
        {
            LinkedId = input.LinkedId,
            LinkType = input.LinkType
        };
    }
    
    /// <summary>
    /// Mapped from video-api response to response
    /// </summary>
    /// <param name="input">LinkedParticipant</param>
    /// <returns></returns>
    public static LinkedParticipantResponse Map(VHLinkedParticipantResponse input)
    {
        return new LinkedParticipantResponse
        {
            LinkedId = input.LinkedId,
            LinkType = Enum.Parse<LinkType>(input.Type.ToString())
        };
    }
}
