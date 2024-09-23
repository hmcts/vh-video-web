using System;

namespace VideoWeb.Common.Models;

public class TelephoneParticipant
{
    public Guid Id { get; set; }
    public string PhoneNumber { get; set; }
    public bool Connected { get; set; }
    public RoomType Room { get; set; }
    
    public void UpdateRoom(RoomType room)
    {
        Room = room;
    }
}
