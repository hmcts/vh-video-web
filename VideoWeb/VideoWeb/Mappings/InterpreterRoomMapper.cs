using VideoWeb.Contract.Responses;
using VideoWeb.Mappings.Interfaces;
using VideoWeb.Services.Video;

namespace VideoWeb.Mappings
{
    public class InterpreterRoomMapper : IMapTo<InterpreterRoomResponse, InterpreterRoom>
    {
        public InterpreterRoom Map(InterpreterRoomResponse input)
        {
            return new InterpreterRoom
            {
                PexipNode = input.Pexip_node,
                ParticipantJoinUri = input.Participant_join_uri
            };
        }
    }
}
