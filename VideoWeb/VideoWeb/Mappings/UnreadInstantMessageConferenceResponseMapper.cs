using System;
using System.Collections.Generic;
using System.Linq;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings.Interfaces;
using VideoApi.Contract.Responses;

namespace VideoWeb.Mappings
{
    public class UnreadInstantMessageConferenceCountResponseMapper : IMapTo<ConferenceDto, IList<InstantMessageResponse>, UnreadInstantMessageConferenceCountResponse>
    {

        public UnreadInstantMessageConferenceCountResponse Map(ConferenceDto conferenceDto, IList<InstantMessageResponse> messageResponses)
        {
            var response = new UnreadInstantMessageConferenceCountResponse
            {
                NumberOfUnreadMessagesConference = MapMessages(conferenceDto, messageResponses)
            };
            return response;
        }

        private List<UnreadAdminMessageResponse> MapMessages(ConferenceDto conferenceDto, IList<InstantMessageResponse> messageResponses)
        {
            var unreadMessagesPerParticipant = new List<UnreadAdminMessageResponse>();
            foreach (var participant in conferenceDto.Participants)
            {
                var participantMessageResponses = messageResponses
                    .Where(p => p.From == participant.Username || p.To == participant.Username)
                    .OrderByDescending(x => x.TimeStamp).ToList();

                var vhoMessage = participantMessageResponses.FirstOrDefault(m => IsNonParticipantMessage(conferenceDto, m));
                var participantMessageCount = vhoMessage == null ? participantMessageResponses.Count : participantMessageResponses.IndexOf(vhoMessage);
                unreadMessagesPerParticipant.Add(new UnreadAdminMessageResponse
                {
                    NumberOfUnreadMessages = participantMessageCount,
                    ParticipantId = participant.Id
                });
            }
            return unreadMessagesPerParticipant;
        }

        private bool IsNonParticipantMessage(ConferenceDto conferenceDto, InstantMessageResponse message)
        {
            return !conferenceDto.Participants.Any(p => p.Username.Equals(message.From, StringComparison.InvariantCultureIgnoreCase));
        }
    }
}
