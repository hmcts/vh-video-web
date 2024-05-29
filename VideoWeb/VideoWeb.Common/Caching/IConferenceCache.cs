using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using VideoWeb.Common.Models;
using VideoApi.Contract.Responses;
using ParticipantSummaryResponse = VideoApi.Contract.Responses.ParticipantSummaryResponse;

namespace VideoWeb.Common.Caching
{
    public interface IConferenceCache
    {
        Task AddConferenceAsync(ConferenceDetailsResponse conferenceResponse);
        Task UpdateConferenceAsync(Conference conference);
        Task<Conference>GetOrAddConferenceAsync(Guid id, Func<Task<ConferenceDetailsResponse>> addConferenceDetailsFactory);
        
        // Task AddConferenceParticipantsAsync(ICollection<ParticipantSummaryResponse> participantsResponse,
        //     Guid conferenceId);
        // Task UpdateParticipantsAsync(IEnumerable<Participant> participants, Guid conferenceId);
        //
        // Task<List<Participant>>GetOrAddParticipantsAsync(Guid id, Func<Task<ICollection<ParticipantSummaryResponse>>> addParticipantsDetailsFactory);
    }
}
