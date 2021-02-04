using System;
using System.Collections.Generic;
using System.Linq;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoApi.Contract.Responses;

namespace VideoWeb.Mappings
{
    public class UnreadAdminMessageResponseMapper : IMapTo<Conference, IList<InstantMessageResponse>, UnreadAdminMessageResponse>
    {
        public UnreadAdminMessageResponse Map(Conference conference, IList<InstantMessageResponse> messageResponses)
        {
            var response = new UnreadAdminMessageResponse
            {
                NumberOfUnreadMessages = MapMessages(conference, messageResponses),
                ParticipantId = conference.GetJudge().Id
            };
            return response;
        }

        private int MapMessages(Conference conference, IList<InstantMessageResponse> messageResponses)
        {
            if (messageResponses == null || !messageResponses.Any())
            {
                return 0;
            }

            messageResponses = messageResponses.OrderByDescending(x => x.TimeStamp).ToList();
            var vhoMessage = messageResponses.FirstOrDefault(m => IsNonParticipantMessage(conference, m));
            return vhoMessage == null ? messageResponses.Count() : messageResponses.IndexOf(vhoMessage);
        }

        private bool IsNonParticipantMessage(Conference conference, InstantMessageResponse message)
        {
            return !conference.Participants.Any(p => p.Username.Equals(message.From, StringComparison.InvariantCultureIgnoreCase));
        }
    }
}
