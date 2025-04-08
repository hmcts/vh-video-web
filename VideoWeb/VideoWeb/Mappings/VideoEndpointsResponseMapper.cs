using System;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoApi.Contract.Responses;
namespace VideoWeb.Mappings;

public static class VideoEndpointsResponseMapper
{
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
            ParticipantsLinked = endpoint.ParticipantsLinked,
            InterpreterLanguage = endpoint.InterpreterLanguage?.Map(),
            ExternalReferenceId = endpoint.ExternalReferenceId,
            ProtectFrom = endpoint.ProtectFrom
        };
    }
}
