using System;
using System.Collections.Generic;
using System.Linq;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings.Interfaces;
using VideoApi.Contract.Responses;

namespace VideoWeb.Mappings
{
    public class UnreadInstantMessageConferenceCountResponseMapper : IMapTo<Conference, IList<InstantMessageResponse>, UnreadInstantMessageConferenceCountResponse>
    {

        public UnreadInstantMessageConferenceCountResponse Map(Conference conference, IList<InstantMessageResponse> messageResponses)
        {
            var response = new UnreadInstantMessageConferenceCountResponse
            {
                NumberOfUnreadMessagesConference = MapMessages(conference, messageResponses)
            };
            return response;
        }

        private List<UnreadAdminMessageResponse> MapMessages(Conference conference, IList<InstantMessageResponse> messageResponses)
        {
            var unreadMessagesPerParticipant = new List<UnreadAdminMessageResponse>();
            foreach (var participant in conference.Participants)
            {
                var participantMessageResponses = messageResponses
                    .Where(p => p.From == participant.Username || p.To == participant.Username)
                    .OrderByDescending(x => x.Time_stamp).ToList();

                var vhoMessage = participantMessageResponses.FirstOrDefault(m => IsNonParticipantMessage(conference, m));
                var participantMessageCount = vhoMessage == null ? participantMessageResponses.Count : participantMessageResponses.IndexOf(vhoMessage);
                unreadMessagesPerParticipant.Add(new UnreadAdminMessageResponse
                {
                    NumberOfUnreadMessages = participantMessageCount,
                    ParticipantId = participant.Id
                });
            }
            return unreadMessagesPerParticipant;
        }

        private bool IsNonParticipantMessage(Conference conference, InstantMessageResponse message)
        {
            return !conference.Participants.Any(p => p.Username.Equals(message.From, StringComparison.InvariantCultureIgnoreCase));
        }
    }
}
