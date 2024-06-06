using VideoWeb.Common.Models;

namespace VideoWeb.Contract.Responses;

/// <summary>
/// TODO: Will be used in JVS endpoint updates
/// </summary>
public class EndpointParticipantResponse
{
    public string ParticipantUsername { get; set; }
    public LinkType LinkType { get; set; }
}
