using VideoWeb.Contract.Responses;
using VideoWeb.Mappings.Interfaces;
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
                Id = input.Id.ToString(),
                Label = input.Label,
                Locked = input.Locked
            };
        }
    }
}
