using VideoWeb.Common.Models;
using VideoWeb.EventHub.Models;

namespace VideoWeb.Mappings;

public static class ConferenceDetailsToUpdatedAllocationDtoMapper
{
    public static UpdatedAllocationDto MapToUpdatedAllocationDto(Conference conference)
    {
        return new UpdatedAllocationDto(ConferenceResponseMapper.Map(conference));
    }
}
