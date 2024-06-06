using System;

namespace VideoWeb.Common.Models;

/// <summary>
/// TODO: Will be used in JVS endpoint updates
/// </summary>
public class EndpointParticipant
{
    public Guid ParticipantId { get; set; }
    public Guid ParticipantRefId { get; set; }
    public string ParticipantUsername { get; set; }
    public LinkType LinkedParticipantType { get; set; }
}
