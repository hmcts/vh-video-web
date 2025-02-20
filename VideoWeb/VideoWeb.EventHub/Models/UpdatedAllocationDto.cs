using System;

namespace VideoWeb.EventHub.Models;

public record UpdatedAllocationDto(
    Guid ConferenceId,
    DateTime ScheduledDateTime,
    string CaseName,
    string JudgeDisplayName,
    string AllocatedToCsoUsername,
    string AllocatedToCsoDisplayName,
    Guid? AllocatedToCsoId);
