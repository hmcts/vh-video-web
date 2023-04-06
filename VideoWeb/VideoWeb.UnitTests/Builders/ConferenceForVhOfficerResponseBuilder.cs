using System;
using System.Collections.Generic;
using VideoApi.Contract.Responses;
using VideoWeb.Contract.Responses;

namespace VideoWeb.UnitTests.Builders
{
    public static class ConferenceForVhOfficerResponseBuilder
    {
        public static List<ConferenceForVhOfficerResponse> BuildData()
        {
            return new List<ConferenceForVhOfficerResponse> {
                new ConferenceForVhOfficerResponse{ScheduledDateTime=DateTime.UtcNow.AddHours(1), HearingVenueName= "Venue Name 01", Participants = new List<ParticipantForUserResponse>{ new ParticipantForUserResponse
                {
                    FirstName = "FirstName1",
                    LastName = "LastName1",
                    HearingRole = "Judge"
                }}},
                new ConferenceForVhOfficerResponse{ScheduledDateTime=DateTime.UtcNow.AddHours(1), HearingVenueName="Venue Name 02",Participants = new List<ParticipantForUserResponse>{ new ParticipantForUserResponse
                {
                    FirstName = "FirstName1",
                    LastName = "LastName2",
                    HearingRole = "Judge"
                }}},
                new ConferenceForVhOfficerResponse{ScheduledDateTime=DateTime.UtcNow.AddHours(1), HearingVenueName="Venue Name 03", Participants = new List<ParticipantForUserResponse>{ new ParticipantForUserResponse
                    {
                    FirstName = "FirstName1",
                    LastName = "LastName3",
                    HearingRole = "Judge"
                }}},
                new ConferenceForVhOfficerResponse{ScheduledDateTime=DateTime.UtcNow.AddHours(1), HearingVenueName="Venue Name 04", Participants = new List<ParticipantForUserResponse>{ new ParticipantForUserResponse
                {
                    FirstName = "FirstName4",
                    LastName = "LastName4",
                    HearingRole = "Judge"
                }}},
                new ConferenceForVhOfficerResponse{ScheduledDateTime=DateTime.UtcNow.AddHours(1), HearingVenueName="Venue Name 05", Participants = new List<ParticipantForUserResponse>{ new ParticipantForUserResponse
                {
                    FirstName = "FirstName4",
                    LastName = "LastName4",
                    HearingRole = "Judge"
                }}},
            };
        }
    }
}
