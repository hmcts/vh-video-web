using System;

namespace VideoWeb.Common.Models;

public class TelephoneParticipant
{
    public Guid Id { get; set; }
    public string PhoneNumber { get; set; }
    public bool Connected { get; set; }
    public RoomType Room { get; set; }
    /// <summary>
    /// This is the time stamp of the last event that was sent for a change to the tel participant
    /// </summary>
    public DateTime? LastEventTime { get; set; }
    
    public void UpdateRoom(RoomType room)
    {
        Room = room;
    }
}
