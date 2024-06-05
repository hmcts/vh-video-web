using VideoWeb.Contract.Responses;
using VideoWeb.Mappings.Interfaces;
using VideoWeb.Common.Models;

namespace VideoWeb.Mappings
{
    public class RoomSummaryResponseMapper : IMapTo<ParticipantMeetingRoom, RoomSummaryResponse>
    {
        public RoomSummaryResponse Map(ParticipantMeetingRoom input)
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
