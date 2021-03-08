using System;
using System.Threading.Tasks;
using VideoWeb.Common.Models;
using VideoApi.Contract.Responses;

namespace VideoWeb.Common.Caching
{
    public interface IConferenceCache
    {
        Task AddConferenceAsync(ConferenceDetailsResponse conferenceResponse);
        Task <Conference>GetOrAddConferenceAsync(Guid id, Func<Task<ConferenceDetailsResponse>> addConferenceDetailsFactory);
    }
}
