using VideoWeb.Common.Models;

namespace VideoWeb.Contract.Responses;

public class EndpointParticipantResponse
{
    public string ParticipantUsername { get; set; }
    public LinkType LinkType { get; set; }
}
