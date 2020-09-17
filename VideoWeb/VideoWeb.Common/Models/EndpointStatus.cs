namespace VideoWeb.Common.Models
{
    /// <summary>
    /// Known states of an endpoint
    /// </summary>
    public enum EndpointStatus
    {
        NotYetJoined = 1,
        Connected = 2,
        Disconnected = 3,
        InConsultation = 4
    }
}
