using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings.Interfaces;

namespace VideoWeb.Mappings
{
    public class RoomSummaryResponseFromDtoMapper : IMapTo<ConsultationRoom, RoomSummaryResponse>
    {
        public RoomSummaryResponse Map(ConsultationRoom input)
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
