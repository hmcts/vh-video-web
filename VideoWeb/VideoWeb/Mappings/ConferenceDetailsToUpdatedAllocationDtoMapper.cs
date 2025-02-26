using VideoWeb.Common.Models;
using VideoWeb.EventHub.Models;

namespace VideoWeb.Mappings;

public static class ConferenceDetailsToUpdatedAllocationDtoMapper
{
    public static UpdatedAllocationDto MapToUpdatedAllocationDto(Conference conference)
    {
        return new UpdatedAllocationDto(conference.Id, ConferenceResponseMapper.Map(conference), conference.ScheduledDateTime, conference.CaseName,
            conference.GetJudge()?.DisplayName, conference.AllocatedCsoUsername, conference.AllocatedCso, conference.AllocatedCsoId);
    }
}
