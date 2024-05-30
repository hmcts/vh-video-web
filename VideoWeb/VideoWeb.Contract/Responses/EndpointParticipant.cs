using VideoWeb.Common.Models;

namespace VideoWeb.Contract.Responses;

public class EndpointParticipant
{
    public string ParticipantUsername { get; set; }
    public LinkType LinkType { get; set; }
}
