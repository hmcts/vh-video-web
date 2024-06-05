using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings.Interfaces;

namespace VideoWeb.Mappings
{
    public class RoomSummaryResponseFromDtoMapper : IMapTo<MeetingRoomDto, RoomSummaryResponse>
    {
        public RoomSummaryResponse Map(MeetingRoomDto input)
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
