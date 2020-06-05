using System.Collections.Generic;

namespace VideoWeb.Contract.Responses
{
    public class UnreadInstantMessageConferenceCountResponse
    {
        public UnreadInstantMessageConferenceCountResponse()
        {
            NumberOfUnreadMessagesConference = new List<UnreadAdminMessageResponse>();
        }
        public List<UnreadAdminMessageResponse> NumberOfUnreadMessagesConference { get; set; }
    }
}
