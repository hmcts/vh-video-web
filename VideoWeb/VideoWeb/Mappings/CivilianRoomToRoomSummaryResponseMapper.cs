using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings.Interfaces;

namespace VideoWeb.Mappings
{
    public class CivilianRoomToRoomSummaryResponseMapper : IMapTo<CivilianRoomDto, RoomSummaryResponse>
    {
        public RoomSummaryResponse Map(CivilianRoomDto input)
        {
            if(input != null)
            {
                return new RoomSummaryResponse
                {
                    Id = input.Id.ToString(),
                    Label = input.RoomLabel
                };
            }

            return null;
        }
    }
}
