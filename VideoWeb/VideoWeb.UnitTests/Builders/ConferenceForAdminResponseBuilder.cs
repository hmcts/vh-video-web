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
                new ConferenceForAdminResponse{ScheduledDateTime=DateTime.UtcNow.AddHours(1), HearingVenueName= "Venue Name 01", Participants = new List<ParticipantResponse>{ new ParticipantResponse
                {
                    UserRole = VideoApi.Contract.Enums.UserRole.Judge,
                    DisplayName = "Name1",
                    LinkedParticipants = new List<LinkedParticipantResponse>()
                }}, HearingRefId = Guid.NewGuid()},
                new ConferenceForAdminResponse{ScheduledDateTime=DateTime.UtcNow.AddHours(1), HearingVenueName="Venue Name 01",Participants = new List<ParticipantResponse>{ new ParticipantResponse
                {
                    UserRole = VideoApi.Contract.Enums.UserRole.Judge,
                    DisplayName = "Name2",
                    LinkedParticipants = new List<LinkedParticipantResponse>()
                }}, HearingRefId = Guid.NewGuid()},
                new ConferenceForAdminResponse{ScheduledDateTime=DateTime.UtcNow.AddHours(1), HearingVenueName="Venue Name 01", Participants = new List<ParticipantResponse>{ new ParticipantResponse
                    {
                        UserRole = VideoApi.Contract.Enums.UserRole.Judge,
                        LinkedParticipants = new List<LinkedParticipantResponse>(),
                        DisplayName = "Name3",
                }}, HearingRefId = Guid.NewGuid()},
                new ConferenceForAdminResponse{ScheduledDateTime=DateTime.UtcNow.AddHours(1), HearingVenueName="Venue Name 02", Participants = new List<ParticipantResponse>{ new ParticipantResponse
                {
                    UserRole = VideoApi.Contract.Enums.UserRole.Judge,
                    LinkedParticipants = new List<LinkedParticipantResponse>(),
                    DisplayName = "Name4",
                }}, HearingRefId = Guid.NewGuid()},
                new ConferenceForAdminResponse{ScheduledDateTime=DateTime.UtcNow.AddHours(1), HearingVenueName="Venue Name 02", Participants = new List<ParticipantResponse>{ new ParticipantResponse
                {
                    UserRole = VideoApi.Contract.Enums.UserRole.Judge,
                    LinkedParticipants = new List<LinkedParticipantResponse>(),
                    DisplayName = "Name5",
                }}, HearingRefId = Guid.NewGuid()},
            };
        }
    }
}
