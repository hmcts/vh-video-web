namespace VideoWeb.EventHub.Enums
{
    public enum ParticipantState
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
}