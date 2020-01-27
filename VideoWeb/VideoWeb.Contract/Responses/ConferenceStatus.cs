namespace VideoWeb.Contract.Responses
{
    /// <summary>
    /// Known states of a conference
    /// </summary>
    public enum ConferenceStatus
    {
        NotStarted = 0,
        InSession = 1,
        Paused = 2,
        Suspended = 3,
        Closed = 4
    }
}