using System;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoApi.Contract.Responses;
namespace VideoWeb.Mappings;

public static class VideoEndpointsResponseMapper
{
    /// <summary>
    /// Mapped from video api response
    /// </summary>
    /// <param name="endpoint"></param>
    /// <returns></returns>
    public static VideoEndpointResponse Map(EndpointResponse endpoint)
    {
        var status = Enum.Parse<EndpointStatus>(endpoint.Status.ToString());
        var pexipDisplayName = $"PSTN;{endpoint.DisplayName};{endpoint.Id}";
        return new VideoEndpointResponse
        {
            DisplayName = endpoint.DisplayName,
            Id = endpoint.Id,
            Status = status,
            PexipDisplayName = pexipDisplayName,
            CurrentRoom = RoomSummaryResponseMapper.Map(endpoint.CurrentRoom),
            DefenceAdvocateUsername = endpoint.DefenceAdvocate,
        };
    }
    
    /// <summary>
    /// Mapped from dto
    /// </summary>
    /// <param name="endpoint"></param>
    /// <returns></returns>
    public static VideoEndpointResponse Map(Endpoint endpoint)
    {
        var pexipDisplayName = $"PSTN;{endpoint.DisplayName};{endpoint.Id}";
        return new VideoEndpointResponse
        {
            DisplayName = endpoint.DisplayName,
            Id = endpoint.Id,
            Status = endpoint.EndpointStatus,
            PexipDisplayName = pexipDisplayName,
            CurrentRoom = RoomSummaryResponseMapper.Map(endpoint.CurrentRoom),
            DefenceAdvocateUsername = endpoint.DefenceAdvocateUsername,
            InterpreterLanguage = endpoint.InterpreterLanguage?.Map()
        };
    }
}
