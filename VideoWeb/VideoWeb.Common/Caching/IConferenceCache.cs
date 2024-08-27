using System;
using System.Threading;
using System.Threading.Tasks;
using BookingsApi.Contract.V2.Responses;
using VideoWeb.Common.Models;
using VideoApi.Contract.Responses;

namespace VideoWeb.Common.Caching
{
    public interface IConferenceCache
    {
        Task AddConferenceAsync(ConferenceDetailsResponse conferenceResponse, HearingDetailsResponseV2 hearingDetailsResponse, CancellationToken cancellationToken = default);
        Task UpdateConferenceAsync(Conference conference, CancellationToken cancellationToken = default);
        Task <Conference> GetOrAddConferenceAsync(Guid id, Func<Task<(ConferenceDetailsResponse, HearingDetailsResponseV2)>> addConferenceDetailsFactory, CancellationToken cancellationToken = default);
    }
}
