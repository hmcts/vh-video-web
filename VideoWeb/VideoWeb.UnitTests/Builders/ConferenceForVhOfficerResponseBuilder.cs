using System;
using System.Collections.Generic;
using VideoApi.Contract.Enums;
using VideoApi.Contract.Responses;
using VideoWeb.Common.Models;
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
                    DisplayName = "Alpha",
                    Role = Role.Judge
                }}},
                new ConferenceForVhOfficerResponse{ScheduledDateTime=DateTime.UtcNow.AddHours(1), HearingVenueName="Venue Name 01",Participants = new List<ParticipantForUserResponse>{ new ParticipantForUserResponse
                {
                    DisplayName = "Beta",
                    Role = Role.Judge
                }}},
                new ConferenceForVhOfficerResponse{ScheduledDateTime=DateTime.UtcNow.AddHours(1), HearingVenueName="Venue Name 01", Participants = new List<ParticipantForUserResponse>{ new ParticipantForUserResponse
                {
                    DisplayName = "Gamma",
                    Role = Role.Judge
                }}},
                new ConferenceForVhOfficerResponse{ScheduledDateTime=DateTime.UtcNow.AddHours(1), HearingVenueName="Venue Name 02", Participants = new List<ParticipantForUserResponse>{ new ParticipantForUserResponse
                {
                    DisplayName = "Gamma",
                    Role = Role.Judge
                }}},
            };
        }
    }
}
