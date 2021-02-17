using System;
using System.Collections.Generic;
using FizzWare.NBuilder;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Enums;
using VideoWeb.Contract.Request;

namespace VideoWeb.UnitTests.Controllers.ConsultationController
{
    public static class ConsultationHelper
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
                        .With(x => x.Role = Role.Judge).With(x => x.Id = Guid.NewGuid())
                        .Build(),
                    Builder<Participant>.CreateNew().With(x => x.Role = Role.Individual)
                        .With(x => x.Id = Guid.NewGuid()).Build(),
                    Builder<Participant>.CreateNew().With(x => x.Role = Role.Representative)
                        .With(x=> x.Username = "rep1@hmcts.net")
                        .With(x => x.Id = Guid.NewGuid()).Build(),
                    Builder<Participant>.CreateNew().With(x => x.Role = Role.Individual)
                        .With(x => x.Id = Guid.NewGuid()).Build(),
                    Builder<Participant>.CreateNew().With(x => x.Role = Role.Representative)
                        .With(x => x.Id = Guid.NewGuid()).Build()
                },
                Endpoints = new List<Endpoint>
                {
                    Builder<Endpoint>.CreateNew().With(x => x.Id = Guid.NewGuid()).With(x => x.DisplayName = "EP1")
                        .With(x=> x.DefenceAdvocateUsername = "rep1@hmcts.net").Build(),
                    Builder<Endpoint>.CreateNew().With(x => x.Id = Guid.NewGuid()).With(x => x.DisplayName = "EP2").Build()
                }
            };
        }

        public static LeavePrivateConsultationRequest GetLeaveConsultationRequest(Conference conference)
        {
            return Builder<LeavePrivateConsultationRequest>.CreateNew()
                .With(x => x.ConferenceId = conference.Id)
                .With(x => x.ParticipantId = conference.Participants[0].Id)
                .Build();
        }

        public static PrivateConsultationRequest GetConsultationRequest(Conference conference)
        {
            return Builder<PrivateConsultationRequest>.CreateNew()
                .With(x => x.ConferenceId = conference.Id)
                .With(x => x.RequestedById = conference.Participants[1].Id)
                .With(x => x.RequestedForId = conference.Participants[2].Id)
                .With(x => x.Answer = null)
                .Build();
        }
        public static PrivateAdminConsultationRequest GetAdminConsultationRequest(Conference conference, ConsultationAnswer answer)
        {
            return Builder<PrivateAdminConsultationRequest>.CreateNew()
                .With(x => x.ConferenceId = conference.Id)
                .With(x => x.ParticipantId = conference.Participants[1].Id)
                .With(x => x.ConsultationRoom = RoomType.ConsultationRoom1)
                .With(x => x.Answer = answer)
                .Build();
        }

        public static StartPrivateConsultationRequest GetStartConsultationRequest(Conference conference)
        {
            return Builder<StartPrivateConsultationRequest>.CreateNew()
                .With(x => x.ConferenceId = conference.Id)
                .With(x => x.RequestedBy = conference.Participants[1].Id)
                .With(x => x.RoomType = VirtualCourtRoomType.JudgeJOH)
                .Build();
        }

    }
}
