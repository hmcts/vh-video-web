namespace VideoWeb.Common.Models
{
    public class RoomResponse
    {
        /// <summary>
        /// Room Id
        /// </summary>
        public string Id { get; set; }
        
        /// <summary>
        /// Room label
        /// </summary>
        public string Label { get; set; }

        /// <summary>
        /// Is the room locked
        /// </summary>
        public bool Locked { get; set; }
    }
}
