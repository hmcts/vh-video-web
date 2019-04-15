using System.Runtime.Serialization;

namespace VideoWeb.Contract.Responses
{
    /// <summary>
    /// Known states of a conference
    /// </summary>
    public enum ConferenceStatus
    {
        [EnumMember(Value = "Not Started")]
        NotStarted = 0,
        [EnumMember(Value = "In Session")]
        InSession = 1,
        Paused = 2,
        Suspended = 3,
        Closed = 4
    }
}