using VideoWeb.Contract.Responses;
using VideoWeb.Mappings.Interfaces;
using VideoWeb.Services.Video;

namespace VideoWeb.Mappings
{
    public class InterpreterRoomMapper : IMapTo<InterpreterRoomResponse, InterpreterRoom>
    {
        public InterpreterRoom Map(InterpreterRoomResponse input)
        {
            var node = input.Pexip_node.Replace("https://", string.Empty);
            return new InterpreterRoom
            {
                PexipNode = node,
                ParticipantJoinUri = input.Participant_join_uri
            };
        }
    }
}
