namespace VideoWeb.EventHub.Enums
{
    public enum EventType
    {
        None,
        Joined,
        Disconnected,
        Transfer,
        Help,
        Pause,
        Close,
        Leave,
        Consultation,
        MediaPermissionDenied,
        ParticipantJoining,
        SelfTestFailed,
        Suspend,
        VhoCall,
        ParticipantNotSignedIn,
        Start,
        CountdownFinished,
        EndpointJoined,
        EndpointDisconnected,
        EndpointTransfer
    }
}
