using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings.Interfaces;

namespace VideoWeb.Mappings
{
    public class RoomSummaryResponseFromDtoMapper : IMapTo<MeetingRoom, RoomSummaryResponse>
    {
        public RoomSummaryResponse Map(MeetingRoom input)
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
