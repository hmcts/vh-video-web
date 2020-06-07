using System.Collections.Generic;

namespace VideoWeb.Contract.Responses
{ public class UnreadInstantMessageConferenceCountResponse
    {
        public List<UnreadAdminMessageResponse> NumberOfUnreadMessagesInConference { get; set; }
    }
}
