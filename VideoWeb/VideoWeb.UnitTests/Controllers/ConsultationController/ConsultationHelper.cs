using System;
using System.Collections.Generic;
using FizzWare.NBuilder;
using VideoWeb.EventHub.Models;
using VideoWeb.Services.Video;
using UserRole = VideoWeb.EventHub.Enums.UserRole;

namespace VideoWeb.UnitTests.Controllers.ConsultationController
{
    public class ConsultationHelper
    {
        public static Conference BuildConferenceForTest()
        {
            return new Conference
            {
                Id = Guid.NewGuid(),
                HearingId = Guid.NewGuid(),
                Participants = new List<Participant>()
                {
                    Builder<Participant>.CreateNew()
                        .With(x => x.Role = EventHub.Enums.UserRole.Judge).With(x => x.Id = Guid.NewGuid())
                        .Build(),
                    Builder<Participant>.CreateNew().With(x => x.Role = EventHub.Enums.UserRole.Individual)
                        .With(x => x.Id = Guid.NewGuid()).Build(),
                    Builder<Participant>.CreateNew().With(x => x.Role = EventHub.Enums.UserRole.Representative)
                        .With(x => x.Id = Guid.NewGuid()).Build(),
                    Builder<Participant>.CreateNew().With(x => x.Role = EventHub.Enums.UserRole.Individual)
                        .With(x => x.Id = Guid.NewGuid()).Build(),
                    Builder<Participant>.CreateNew().With(x => x.Role = UserRole.Representative)
                        .With(x => x.Id = Guid.NewGuid()).Build()
                }
            };
        }

        public static LeaveConsultationRequest GetLeaveConsultationRequest(Conference conference)
        {
            return Builder<LeaveConsultationRequest>.CreateNew()
                .With(x => x.Conference_id = conference.Id)
                .With(x => x.Participant_id = conference.Participants[0].Id)
                .Build();
        }

        public static ConsultationRequest GetConsultationRequest(Conference conference)
        {
            return Builder<ConsultationRequest>.CreateNew()
                .With(x => x.Conference_id = conference.Id)
                .With(x => x.Requested_by = conference.Participants[1].Id)
                .With(x => x.Requested_for = conference.Participants[2].Id)
                .Build();
        }
        public static AdminConsultationRequest GetAdminConsultationRequest(Conference conference, ConsultationAnswer answer)
        {
            return Builder<AdminConsultationRequest>.CreateNew()
                .With(x => x.Conference_id = conference.Id)
                .With(x => x.Participant_id = conference.Participants[1].Id)
                .With(x => x.Consultation_room = RoomType.ConsultationRoom1)
                .With(x => x.Answer = answer)
                .Build();
        }


    }
}