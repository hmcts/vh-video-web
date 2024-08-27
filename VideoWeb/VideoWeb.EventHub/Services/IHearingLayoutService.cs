using System;
using System.Threading;
using System.Threading.Tasks;
using VideoApi.Contract.Requests;

namespace VideoWeb.EventHub.Services
{
    public interface IHearingLayoutService
    {
        Task UpdateLayout(Guid conferenceId, Guid changedById, HearingLayout newLayout, CancellationToken cancellationToken = default);
        Task<HearingLayout?> GetCurrentLayout(Guid conferenceId, CancellationToken cancellationToken = default);
    }

}
