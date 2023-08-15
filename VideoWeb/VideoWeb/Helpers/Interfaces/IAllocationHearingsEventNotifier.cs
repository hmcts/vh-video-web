using System.Collections.Generic;
using System.Threading.Tasks;
using VideoApi.Contract.Requests;

namespace VideoWeb.Helpers.Interfaces;

public interface IAllocationHearingsEventNotifier
{
    public Task PushAllocationHearingsEvent(string csoUserName, IList<HearingDetailRequest> hearings);
}

