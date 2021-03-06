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
                First_name = input.FirstName,
                Last_name = input.LastName,
                Fullname = input.Fullname,
                Display_name = input.DisplayName,
                Representee = input.Representee
            };
        }
    }
}
