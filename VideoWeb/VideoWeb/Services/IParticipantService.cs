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
    }
}
