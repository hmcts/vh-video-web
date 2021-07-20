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
