using VideoWeb.Contract.Responses;
using VideoWeb.Mappings.Interfaces;
using VideoApi.Contract.Responses;
using VideoWeb.Common.Models;
using RoomResponse = VideoWeb.Common.Models.RoomResponse;

namespace VideoWeb.Mappings
{
    public class RoomSummaryResponseMapper : IMapTo<VideoApi.Contract.Responses.RoomResponse, RoomResponse>
    {
        public RoomResponse Map(VideoApi.Contract.Responses.RoomResponse input)
        {
            if (input == null)
            {
                return null;
            }

            return new RoomResponse
            {
                Id = input.Id.ToString(),
                Label = input.Label,
                Locked = input.Locked
            };
        }
    }
}
