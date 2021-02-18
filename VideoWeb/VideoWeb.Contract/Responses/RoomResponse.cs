namespace VideoWeb.Contract.Responses
{
    public class RoomSummaryResponse
    {
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
