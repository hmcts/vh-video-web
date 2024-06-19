using VideoApi.Contract.Responses;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings.Interfaces;

namespace VideoWeb.Mappings;

public class RoomSummaryResponseMapper : IMapTo<RoomResponse, RoomSummaryResponse>
{
    public RoomSummaryResponse Map(RoomResponse input)
    {
        if (input == null)
            return null;
        
        return new RoomSummaryResponse
        {
            Id = input.Id.ToString(), Label = input.Label, Locked = input.Locked
        };
    }
}
