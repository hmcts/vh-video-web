using System;
using System.Collections.Generic;
using System.Linq;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Services.Video;

namespace VideoWeb.Mappings
{
    public static class UnreadAdminMessageResponseMapper
    {
        public static UnreadAdminMessageResponse MapToResponseModel(Conference conference, IList<InstantMessageResponse> messageResponses)
        {
            var response = new UnreadAdminMessageResponse
            {
                NumberOfUnreadMessages = MapMessages(conference, messageResponses),
                ParticipantUsername = null
            };
            return response;
        }

        private static int MapMessages(Conference conference, IList<InstantMessageResponse> messageResponses)
        {
            if (messageResponses == null || !messageResponses.Any())
            {
                return 0;
            }

            messageResponses = messageResponses.OrderByDescending(x => x.Time_stamp).ToList();
            var vhoMessage = messageResponses.FirstOrDefault(m => IsNonParticipantMessage(conference, m));
            return vhoMessage == null ? messageResponses.Count() : messageResponses.IndexOf(vhoMessage);
        }

        private static bool IsNonParticipantMessage(Conference conference, InstantMessageResponse message)
        {
            return !conference.Participants.Any(p => p.Username.Equals(message.From, StringComparison.InvariantCultureIgnoreCase));
        }
    }
}
