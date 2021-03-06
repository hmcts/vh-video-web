using VideoWeb.Contract.Request;
using VideoWeb.Mappings.Interfaces;
using VideoApi.Contract.Requests;

namespace VideoWeb.Mappings
{
    public class UpdateParticipantRequestMapper : IMapTo<UpdateParticipantDisplayNameRequest, UpdateParticipantRequest>
    {
        public UpdateParticipantRequest Map(UpdateParticipantDisplayNameRequest input)
        {
            return new UpdateParticipantRequest
            {
                FirstName = input.FirstName,
                LastName = input.LastName,
                Fullname = input.Fullname,
                DisplayName = input.DisplayName,
                Representee = input.Representee
            };
        }
    }
}
