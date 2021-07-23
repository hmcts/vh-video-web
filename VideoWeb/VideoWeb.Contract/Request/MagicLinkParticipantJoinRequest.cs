using VideoWeb.Common.Models;
using VideoWeb.Contract.Enums;

namespace VideoWeb.Contract.Request
{
    public class MagicLinkParticipantJoinRequest
    {
        public string Name { get; set; }
        public Role Role { get; set; }
    }
}
