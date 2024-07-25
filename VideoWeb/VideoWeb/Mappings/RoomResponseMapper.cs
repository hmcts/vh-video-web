using VideoWeb.Contract.Responses;
using VideoApi.Contract.Responses;

namespace VideoWeb.Mappings;

public static class RoomResponseMapper
{
    public static RoomResponse Map(RoomSummaryResponse input)
    {
        if (input == null)
        {
            return null;
        }
        
        return new RoomResponse
        {
            Id = long.Parse(input.Id),
            Label = input.Label,
            Locked = input.Locked
        };
    }
}
