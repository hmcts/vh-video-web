namespace VideoWeb.Contract.Responses
{
    public class ConferenceForVhOfficerResponse : ConferenceForUserResponse
    {
        /// <summary>
        /// The number of messages since a VHO has answered
        /// </summary>
        public int NumberOfUnreadMessages { get; set; }
    }
}
