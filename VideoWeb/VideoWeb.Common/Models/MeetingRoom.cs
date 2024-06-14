namespace VideoWeb.Common.Models;

public class MeetingRoom
{
    /// <summary>
    /// Room Id
    /// </summary>
    public long Id { get; set; }
    /// <summary>
    /// Room label
    /// </summary>
    public string Label { get; set; }
    /// <summary>
    /// Is the room locked
    /// </summary>
    public bool Locked { get; set; }
    
    public string AdminUrl { get; set; }
}
