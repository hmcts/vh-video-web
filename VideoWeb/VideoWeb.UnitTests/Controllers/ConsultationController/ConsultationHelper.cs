using System;
using System.Collections.Generic;
using System.Linq;
using FizzWare.NBuilder;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Enums;
using VideoWeb.Contract.Request;

namespace VideoWeb.UnitTests.Controllers.ConsultationController
{
    public static class ConsultationHelper
    {
        public static ConferenceDto BuildConferenceForTest()
        {
            return new ConferenceDto
            {
                Id = Guid.NewGuid(),
                HearingId = Guid.NewGuid(),
                Participants = new List<ParticipantDto>
                {
                    Builder<ParticipantDto>.CreateNew()
                        .With(x => x.Role = Role.Judge).With(x => x.Id = Guid.NewGuid())
                        .With(x => x.Username = "judge@hmcts.net")
                        .Build(),
                    Builder<ParticipantDto>.CreateNew().With(x => x.Role = Role.Individual)
                        .With(x => x.Id = Guid.NewGuid()).With(x => x.Username = "john@hmcts.net").Build(),
                    Builder<ParticipantDto>.CreateNew().With(x => x.Role = Role.Representative)
                        .With(x=> x.Username = "rep1@hmcts.net")
                        .With(x => x.Id = Guid.NewGuid()).Build(),
                    Builder<ParticipantDto>.CreateNew().With(x => x.Role = Role.Individual)
                        .With(x => x.Id = Guid.NewGuid()).Build(),
                    Builder<ParticipantDto>.CreateNew().With(x => x.Role = Role.Representative)
                        .With(x => x.Id = Guid.NewGuid()).Build(),
                    Builder<ParticipantDto>.CreateNew()
                        .With(x => x.Role = Role.StaffMember).With(x => x.Id = Guid.NewGuid())
                        .With(x => x.Username = "staffMember@hmcts.net")
                        .Build()
                },
                Endpoints = new List<EndpointDto>
                {
                    Builder<EndpointDto>.CreateNew().With(x => x.Id = Guid.NewGuid()).With(x => x.DisplayName = "EP1")
                        .With(x=> x.EndpointParticipants = new List<EndpointParticipant>{new (){ParticipantUsername = "rep1@hmcts.net"} }).Build(),
                    Builder<EndpointDto>.CreateNew().With(x => x.Id = Guid.NewGuid()).With(x => x.DisplayName = "EP2")
                        .With(x=> x.EndpointParticipants = new List<EndpointParticipant>{new (){ParticipantUsername = "john@hmcts.net"} }).Build(),
                    Builder<EndpointDto>.CreateNew().With(x => x.Id = Guid.NewGuid()).With(x => x.DisplayName = "EP3")
                        .With(x=> x.EndpointParticipants = new List<EndpointParticipant>{new (){ParticipantUsername = "john@hmcts.net"} }).Build(),
                }
            };
        }

        public static LeavePrivateConsultationRequest GetLeaveConsultationRequest(ConferenceDto conferenceDto)
        {
            return Builder<LeavePrivateConsultationRequest>.CreateNew()
                .With(x => x.ConferenceId = conferenceDto.Id)
                .With(x => x.ParticipantId = conferenceDto.Participants[0].Id)
                .Build();
        }

        public static PrivateConsultationRequest GetConsultationRequest(ConferenceDto conferenceDto)
        {
            var participantsWithoutLinked =
                conferenceDto.Participants.Where(x => !x.IsJudge() && !x.LinkedParticipants.Any()).ToList();
            return Builder<PrivateConsultationRequest>.CreateNew()
                .With(x => x.ConferenceId = conferenceDto.Id)
                .With(x => x.RequestedById = participantsWithoutLinked[0].Id)
                .With(x => x.RequestedForId = participantsWithoutLinked[1].Id)
                .With(x => x.RoomLabel = "RoomLabel")
                .With(x => x.Answer = ConsultationAnswer.None)
                .With(x => x.InvitationId = Guid.NewGuid())
                .Build();
        }

        public static StartPrivateConsultationRequest GetStartJohConsultationRequest(ConferenceDto conferenceDto)
        {
            return Builder<StartPrivateConsultationRequest>.CreateNew()
                .With(x => x.ConferenceId = conferenceDto.Id)
                .With(x => x.RequestedBy = conferenceDto.Participants[1].Id)
                .With(x => x.RoomType = VirtualCourtRoomType.JudgeJOH)
                .Build();
        }

        public static StartPrivateConsultationRequest GetStartParticipantConsultationRequest(ConferenceDto conferenceDto)
        {
            return Builder<StartPrivateConsultationRequest>.CreateNew()
                .With(x => x.ConferenceId = conferenceDto.Id)
                .With(x => x.RequestedBy = conferenceDto.Participants[1].Id)
                .With(x => x.RoomType = VirtualCourtRoomType.Participant)
                .With(x => x.InviteParticipants = new[]
                {
                    conferenceDto.Participants[2].Id,
                    conferenceDto.Participants[3].Id
                })
                .With(x => x.InviteEndpoints = new Guid[0])
                .Build();
        }

    }
}
