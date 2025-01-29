using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace VideoWeb.Helpers.Interfaces;

public interface IAllocationHearingsEventNotifier
{
    public Task PushAllocationHearingsEvent(UpdatedAllocationJusticeUserDto update, List<Guid> conferenceIds);
}

public record UpdatedAllocationJusticeUserDto(string AllocatedCsoUsername, Guid AllocatedCsoId);

