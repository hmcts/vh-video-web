namespace VideoWeb.Contract.Responses
{
    public class UnreadAdminMessageResponse
    {
        public string ParticipantUsername { get; set; }
        public int NumberOfUnreadMessages { get; set; }
    }
}
