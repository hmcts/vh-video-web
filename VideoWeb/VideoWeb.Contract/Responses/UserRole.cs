namespace VideoWeb.Contract.Responses
{
    /// <summary>
    /// Known user roles
    /// </summary>
    public enum UserRole
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