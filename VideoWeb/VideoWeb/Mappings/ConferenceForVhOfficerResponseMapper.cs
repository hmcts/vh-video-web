using System;
using System.Collections.Generic;
using System.Linq;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Services.Video;

namespace VideoWeb.Mappings
{
    public static class ConferenceForVhOfficerResponseMapper
    {
        public static ConferenceForVhOfficerResponse MapConferenceSummaryToResponseModel(ConferenceSummaryResponse conference,
            IList<InstantMessageResponse> messageResponses)
        {
            var response = new ConferenceForVhOfficerResponse
            {
                Id = conference.Id,
                CaseName = conference.Case_name,
                CaseNumber = conference.Case_number,
                CaseType = conference.Case_type,
                ScheduledDateTime = conference.Scheduled_date_time,
                ScheduledDuration = conference.Scheduled_duration,
                Status = Enum.Parse<ConferenceStatus>(conference.Status.ToString()),
                NoOfPendingTasks = conference.Pending_tasks,
                HearingVenueName = conference.Hearing_venue_name,
                Participants = ParticipantForUserResponseMapper.MapParticipants(conference.Participants)
            };
            
            MapMessages(response, conference, messageResponses);
            MapTasks(response, conference);
            
            return response;
        }

        private static void MapTasks(ConferenceForVhOfficerResponse response, ConferenceSummaryResponse conference)
        {
            if (conference.Tasks == null) return;
            var conferenceTasks = conference.Tasks
                .Select(x => new TaskUserResponse { Id = x.Id, Body = x.Body })
                .ToList();
                
            response.Tasks = conferenceTasks;
        }

        private static void MapMessages(ConferenceForVhOfficerResponse response, ConferenceSummaryResponse conference,
            IList<InstantMessageResponse> messageResponses)
        {
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
        }

        private static bool IsNonParticipantMessage(ConferenceSummaryResponse conference, InstantMessageResponse message)
        {
            return !conference.Participants.Any(p => p.Username.Equals(message.From, StringComparison.InvariantCultureIgnoreCase));
        }
    }
}
