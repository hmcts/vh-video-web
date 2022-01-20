using VideoWeb.Contract.Responses;
using VideoWeb.Mappings.Interfaces;
using VideoApi.Contract.Responses;

namespace VideoWeb.Mappings
{
    public class RoomResponseMapper : IMapTo<RoomSummaryResponse, RoomResponse>
    {
        public RoomResponse Map(RoomSummaryResponse input)
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
}
