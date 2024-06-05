using System;
using System.Threading.Tasks;
using BookingsApi.Contract.V2.Responses;
using VideoWeb.Common.Models;
using VideoApi.Contract.Responses;

namespace VideoWeb.Common.Caching
{
    public interface IConferenceCache
    {
        Task AddConferenceAsync(ConferenceDetailsResponse conferenceResponse, HearingDetailsResponseV2 hearingDetailsResponse);
        Task UpdateConferenceAsync(ConferenceDto conferenceDto);
        Task <ConferenceDto> GetOrAddConferenceAsync(Guid id, Func<Task<(ConferenceDetailsResponse, HearingDetailsResponseV2)>> addConferenceDetailsFactory);
    }
}
