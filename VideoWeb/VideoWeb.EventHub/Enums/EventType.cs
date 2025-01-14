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
        EndpointTransfer,
        ParticipantsUpdated,
        RecordingConnectionFailed = 23,
        TelephoneJoined = 24,
        TelephoneDisconnected = 25,
        TelephoneTransfer = 26
    }
}
