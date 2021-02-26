using VideoWeb.Contract.Responses;
using VideoWeb.Services.Video;

namespace VideoWeb.Mappings
{
    public class RoomResponseMapper : IMapTo<RoomResponse, RoomSummaryResponse>
    {
        public RoomSummaryResponse Map(RoomResponse input)
        {
            if (input == null)
            {
                return null;
            }

            return new RoomSummaryResponse
            {
                Label = input.Label,
                Locked = input.Locked
            };
        }
    }
}
