using System.Collections.Generic;

namespace VideoWeb.Contract.Responses
{
    public class UnreadInstantMessageConferenceCountResponse
    {
        public List<UnreadAdminMessageResponse> NumberOfUnreadMessagesConference { get; set; }
        public UnreadInstantMessageConferenceCountResponse()
        {
            NumberOfUnreadMessagesConference = new List<UnreadAdminMessageResponse>();
        }
    }
}
