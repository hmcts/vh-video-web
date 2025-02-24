using System;
using VideoWeb.Contract.Responses;

namespace VideoWeb.EventHub.Models;

public record UpdatedAllocationDto(
    Guid ConferenceId,
    ConferenceResponse Conference,
    DateTime ScheduledDateTime,
    string CaseName,
    string JudgeDisplayName,
    string AllocatedToCsoUsername,
    string AllocatedToCsoDisplayName,
    Guid? AllocatedToCsoId);
