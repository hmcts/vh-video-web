using System;
using System.Collections.Generic;
using UserApi.Contract.Responses;
using VideoApi.Contract.Responses;

namespace VideoWeb.UnitTests.Builders
{
    public static class ConferenceResponseBuilder
    {
        public static List<ConferenceForAdminResponse> BuildData()
        {
            return new List<ConferenceForAdminResponse> {
                new ConferenceForAdminResponse{ScheduledDateTime=DateTime.UtcNow.AddHours(1), HearingVenueName= "Venue Name 01", Participants = new List<ParticipantSummaryResponse>{ new ParticipantSummaryResponse
                {
                    FirstName = "FirstName1",
                    LastName = "LastName1",
                    HearingRole = "Judge"
                }}},
                new ConferenceForAdminResponse{ScheduledDateTime=DateTime.UtcNow.AddHours(1), HearingVenueName="Venue Name 02",Participants = new List<ParticipantSummaryResponse>{ new ParticipantSummaryResponse
                {
                    FirstName = "FirstName1",
                    LastName = "LastName2",
                    HearingRole = "Judge"
                }}},
                new ConferenceForAdminResponse{ScheduledDateTime=DateTime.UtcNow.AddHours(1), HearingVenueName="Venue Name 03", Participants = new List<ParticipantSummaryResponse>{ new ParticipantSummaryResponse
                    {
                    FirstName = "FirstName1",
                    LastName = "LastName3",
                    HearingRole = "Judge"
                }}},
                new ConferenceForAdminResponse{ScheduledDateTime=DateTime.UtcNow.AddHours(1), HearingVenueName="Venue Name 04", Participants = new List<ParticipantSummaryResponse>{ new ParticipantSummaryResponse
                {
                    FirstName = "FirstName4",
                    LastName = "LastName4",
                    HearingRole = "Judge"
                }}},
                new ConferenceForAdminResponse{ScheduledDateTime=DateTime.UtcNow.AddHours(1), HearingVenueName="Venue Name 05", Participants = new List<ParticipantSummaryResponse>{ new ParticipantSummaryResponse
                {
                    FirstName = "FirstName4",
                    LastName = "LastName4",
                    HearingRole = "Judge"
                }}},
            };
        }
    }
}
