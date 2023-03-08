using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using BookingsApi.Contract.Responses;
using VideoApi.Contract.Requests;
using VideoWeb.Common.Models;

namespace VideoWeb.Helpers.Interfaces
{
    public interface IAllocationHearingsEventNotifier
    {
        public Task PushAllocationHearingsEvent(string csoUserName, IList<HearingDetailRequest> hearings);
    }
}
