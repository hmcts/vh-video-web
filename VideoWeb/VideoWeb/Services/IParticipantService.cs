using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using VideoApi.Contract.Requests;
using VideoApi.Contract.Responses;
using VideoWeb.Contract.Responses;

namespace VideoWeb.Services
{
    public interface IParticipantService
    {
        AddStaffMemberRequest InitialiseAddStaffMemberRequest(UserProfileResponse staffMemberProfile,
            string staffMemberEmail);

        bool CanStaffMemberJoinConference(ConferenceDetailsResponse originalConference);

        Task AddStaffMemberToConferenceCache(AddStaffMemberResponse response);
        
        Task<List<ParticipantForUserResponse>> GetParticipantsByConferenceIdAsync(Guid conferenceId);
        
        Task<List<ParticipantContactDetailsResponseVho>> GetParticipantsWithContactDetailsByConferenceIdAsync(Guid conferenceId);
        Task<LoggedParticipantResponse> GetCurrentParticipantAsync(Guid conferenceId, ClaimsPrincipal user);
    }
}
