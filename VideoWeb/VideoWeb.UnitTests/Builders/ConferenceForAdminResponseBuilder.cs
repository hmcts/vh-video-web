using System;
using System.Collections.Generic;
using VideoApi.Contract.Responses;

namespace VideoWeb.UnitTests.Builders
{
    public static class ConferenceForAdminResponseBuilder
    {
        public static List<ConferenceForAdminResponse> BuildData()
        {
            return new List<ConferenceForAdminResponse> {
                new ConferenceForAdminResponse{ScheduledDateTime=DateTime.UtcNow.AddHours(1), HearingVenueName= "Venue Name 01", Participants = new List<ParticipantSummaryResponse>{ new ParticipantSummaryResponse
                {
                    FirstName = "FirstName1",
                    LastName = "LastName1",
                    HearingRole = "Judge",
                    LinkedParticipants = new List<LinkedParticipantResponse>()
                }}, HearingRefId = Guid.NewGuid()},
                new ConferenceForAdminResponse{ScheduledDateTime=DateTime.UtcNow.AddHours(1), HearingVenueName="Venue Name 02",Participants = new List<ParticipantSummaryResponse>{ new ParticipantSummaryResponse
                {
                    FirstName = "FirstName1",
                    LastName = "LastName2",
                    HearingRole = "Judge",
                    LinkedParticipants = new List<LinkedParticipantResponse>()
                }}, HearingRefId = Guid.NewGuid()},
                new ConferenceForAdminResponse{ScheduledDateTime=DateTime.UtcNow.AddHours(1), HearingVenueName="Venue Name 03", Participants = new List<ParticipantSummaryResponse>{ new ParticipantSummaryResponse
                    {
                    FirstName = "FirstName1",
                    LastName = "LastName3",
                    HearingRole = "Judge",
                    LinkedParticipants = new List<LinkedParticipantResponse>()
                }}, HearingRefId = Guid.NewGuid()},
                new ConferenceForAdminResponse{ScheduledDateTime=DateTime.UtcNow.AddHours(1), HearingVenueName="Venue Name 04", Participants = new List<ParticipantSummaryResponse>{ new ParticipantSummaryResponse
                {
                    FirstName = "FirstName4",
                    LastName = "LastName4",
                    HearingRole = "Judge",
                    LinkedParticipants = new List<LinkedParticipantResponse>()
                }}, HearingRefId = Guid.NewGuid()},
                new ConferenceForAdminResponse{ScheduledDateTime=DateTime.UtcNow.AddHours(1), HearingVenueName="Venue Name 05", Participants = new List<ParticipantSummaryResponse>{ new ParticipantSummaryResponse
                {
                    FirstName = "FirstName4",
                    LastName = "LastName4",
                    HearingRole = "Judge",
                    LinkedParticipants = new List<LinkedParticipantResponse>()
                }}, HearingRefId = Guid.NewGuid()},
            };
        }
    }
}
