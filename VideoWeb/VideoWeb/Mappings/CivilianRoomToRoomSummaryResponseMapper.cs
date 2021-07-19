using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings.Interfaces;

namespace VideoWeb.Mappings
{
    public class CivilianRoomToRoomSummaryResponseMapper : IMapTo<CivilianRoom, RoomSummaryResponse>
    {
        public RoomSummaryResponse Map(CivilianRoom input)
        {
            return new RoomSummaryResponse
            {
                Id = input.Id.ToString(),
                Label = input.RoomLabel,
                // TODO Locked status?
            };
        }
    }
}
