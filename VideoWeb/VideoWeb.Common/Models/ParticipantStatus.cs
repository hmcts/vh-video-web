namespace VideoWeb.Common.Models
{
    /// <summary>
    /// Known states of a participant
    /// </summary>
    public enum ParticipantStatus
    {
        None = 0,
        NotSignedIn = 1,
        UnableToJoin = 2,
        Joining = 3,
        Available = 4,
        InHearing = 5,
        InConsultation = 6,
        Disconnected = 7
    }
    
    /// <summary>
    /// Known states of an endpoint
    /// </summary>
    public enum EndpointStatus
    {
        NotYetJoined = 1,
        Connected = 2,
        Disconnected = 3
    }
}
