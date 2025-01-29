using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace VideoWeb.Helpers.Interfaces;

public interface IAllocationHearingsEventNotifier
{
    public Task PushAllocationHearingsEvent(string csoUserName, List<Guid> conferenceIds);
}

