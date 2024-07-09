using System;
using System.Threading.Tasks;
using VideoApi.Contract.Requests;
using VideoApi.Contract.Responses;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using ParticipantResponse = VideoApi.Contract.Responses.ParticipantResponse;

namespace VideoWeb.Services
{
    public interface IParticipantService
    {
        AddStaffMemberRequest InitialiseAddStaffMemberRequest(UserProfileResponse staffMemberProfile,
            string staffMemberEmail);

        bool CanStaffMemberJoinConference(ConferenceDetailsResponse originalConference);

        Task<Conference> AddParticipantToConferenceCache(Guid conferenceId, ParticipantResponse response);
    }
}
