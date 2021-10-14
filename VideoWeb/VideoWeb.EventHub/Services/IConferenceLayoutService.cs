using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;
using VideoApi.Contract.Requests;

namespace VideoWeb.EventHub.Services
{
    public interface IConferenceLayoutService
    {
        Task UpdateLayout(Guid conferenceId, Guid changedById, HearingLayout newLayout);
        Task<HearingLayout?> GetCurrentLayout(Guid conferenceId);
    }

}
