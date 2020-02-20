using System;
using System.Collections.Generic;
using System.Linq;
using VideoWeb.Contract.Responses;
using VideoWeb.Services.Video;

namespace VideoWeb.Mappings
{
    public class ConferenceForVhOfficerResponseMapper
    {
        public ConferenceForVhOfficerResponse MapConferenceSummaryToResponseModel(ConferenceSummaryResponse conference, IList<MessageResponse> messageResponses)
        {
            var response = new ConferenceForUserResponseMapper()
                .MapConferenceSummaryToResponseModel<ConferenceForVhOfficerResponse>(conference);

            if (messageResponses == null || !messageResponses.Any())
            {
                response.NumberOfUnreadMessages = 0;
            }
            else
            {
                messageResponses = messageResponses.OrderByDescending(x => x.Time_stamp).ToList();
                var vhoMessage = messageResponses.FirstOrDefault(m => IsNonParticipantMessage(conference, m));
                response.NumberOfUnreadMessages =
                    vhoMessage == null ? messageResponses.Count() : messageResponses.IndexOf(vhoMessage);
            }

            return response;
        }

        private static bool IsNonParticipantMessage(ConferenceSummaryResponse conference , MessageResponse message)
        {
            return !conference.Participants.Any(p =>
                p.Username.Equals(message.From, StringComparison.InvariantCultureIgnoreCase));
        }
    }
}
