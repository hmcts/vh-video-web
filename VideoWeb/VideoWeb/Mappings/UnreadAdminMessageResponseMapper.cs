using System;
using System.Collections.Generic;
using System.Linq;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings.Interfaces;
using VideoApi.Contract.Responses;

namespace VideoWeb.Mappings
{
    public class UnreadAdminMessageResponseMapper : IMapTo<ConferenceDto, IList<InstantMessageResponse>, UnreadAdminMessageResponse>
    {
        public UnreadAdminMessageResponse Map(ConferenceDto conferenceDto, IList<InstantMessageResponse> messageResponses)
        {
            var response = new UnreadAdminMessageResponse
            {
                NumberOfUnreadMessages = MapMessages(conferenceDto, messageResponses),
                ParticipantId = conferenceDto.GetJudge().Id
            };
            return response;
        }

        private int MapMessages(ConferenceDto conferenceDto, IList<InstantMessageResponse> messageResponses)
        {
            if (messageResponses == null || !messageResponses.Any())
            {
                return 0;
            }

            messageResponses = messageResponses.OrderByDescending(x => x.TimeStamp).ToList();
            var vhoMessage = messageResponses.FirstOrDefault(m => IsNonParticipantMessage(conferenceDto, m));
            return vhoMessage == null ? messageResponses.Count() : messageResponses.IndexOf(vhoMessage);
        }

        private bool IsNonParticipantMessage(ConferenceDto conferenceDto, InstantMessageResponse message)
        {
            return !conferenceDto.Participants.Any(p => p.Username.Equals(message.From, StringComparison.InvariantCultureIgnoreCase));
        }
    }
}
