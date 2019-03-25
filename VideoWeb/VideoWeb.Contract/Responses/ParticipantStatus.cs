namespace VideoWeb.Contract.Responses
{
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
    
    public enum ParticipantRole
    {
        None = 0,
        CaseAdmin = 1,
        VideoHearingsOfficer = 2,
        HearingFacilitationSupport = 3,
        Judge = 4,
        Individual = 5,
        Representative = 6
    }
}