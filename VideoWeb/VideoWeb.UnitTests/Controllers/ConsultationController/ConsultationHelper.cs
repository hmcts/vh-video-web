using System;
using System.Linq;
using FizzWare.NBuilder;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Enums;
using VideoWeb.Contract.Request;

namespace VideoWeb.UnitTests.Controllers.ConsultationController;

public static class ConsultationHelper
{
    public static Conference BuildConferenceForTest()
    {
        return new Conference
        {
            Id = Guid.NewGuid(),
            HearingId = Guid.NewGuid(),
            Participants =
            [
                Builder<Participant>.CreateNew()
                    .With(x => x.Role = Role.Judge).With(x => x.Id = Guid.NewGuid())
                    .With(x => x.Username = "judge@hmcts.net")
                    .Build(),
                
                Builder<Participant>.CreateNew().With(x => x.Role = Role.Individual)
                    .With(x => x.Id = Guid.NewGuid()).With(x => x.Username = "john@hmcts.net")
                    .With(x => x.ExternalReferenceId = Guid.NewGuid().ToString()).Build(),
                
                Builder<Participant>.CreateNew().With(x => x.Role = Role.Representative)
                    .With(x => x.Username = "rep1@hmcts.net")
                    .With(x => x.Id = Guid.NewGuid())
                    .With(x => x.ExternalReferenceId = Guid.NewGuid().ToString()).Build(),
                
                Builder<Participant>.CreateNew().With(x => x.Role = Role.Individual)
                    .With(x => x.Id = Guid.NewGuid())
                    .With(x => x.ExternalReferenceId = Guid.NewGuid().ToString()).Build(),
                
                Builder<Participant>.CreateNew().With(x => x.Role = Role.Representative)
                    .With(x => x.Id = Guid.NewGuid())
                    .With(x => x.ExternalReferenceId = Guid.NewGuid().ToString()).Build(),
                
                Builder<Participant>.CreateNew().With(x => x.Role = Role.QuickLinkObserver)
                    .With(x => x.Id = Guid.NewGuid())
                    .With(x => x.ExternalReferenceId = Guid.NewGuid().ToString()).Build(),
                
                Builder<Participant>.CreateNew()
                    .With(x => x.Role = Role.StaffMember).With(x => x.Id = Guid.NewGuid())
                    .With(x => x.Username = "staffMember@hmcts.net")
                    .Build()
            ],
            Endpoints =
            [
                Builder<Endpoint>.CreateNew().With(x => x.Id = Guid.NewGuid()).With(x => x.DisplayName = "EP1")
                    .With(x => x.ParticipantsLinked = ["rep1@hmcts.net"])
                    .With(x => x.ExternalReferenceId = Guid.NewGuid().ToString()).Build(),
                
                Builder<Endpoint>.CreateNew().With(x => x.Id = Guid.NewGuid()).With(x => x.DisplayName = "EP2")
                    .With(x => x.ParticipantsLinked = ["john@hmcts.net"])
                    .With(x => x.ExternalReferenceId = Guid.NewGuid().ToString()).Build(),
                
                Builder<Endpoint>.CreateNew().With(x => x.Id = Guid.NewGuid()).With(x => x.DisplayName = "EP3")
                    .With(x => x.ParticipantsLinked = ["john@hmcts.net"])
                    .With(x => x.ExternalReferenceId = Guid.NewGuid().ToString()).Build()
            ]
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
        var participantsWithoutLinked =
            conference.Participants.Where(x => !x.IsJudge() && x.LinkedParticipants.Count == 0).ToList();
        return Builder<PrivateConsultationRequest>.CreateNew()
            .With(x => x.ConferenceId = conference.Id)
            .With(x => x.RequestedById = participantsWithoutLinked[0].Id)
            .With(x => x.RequestedForId = participantsWithoutLinked[1].Id)
            .With(x => x.RoomLabel = "RoomLabel")
            .With(x => x.Answer = ConsultationAnswer.None)
            .With(x => x.InvitationId = Guid.NewGuid())
            .Build();
    }
    
    public static StartPrivateConsultationRequest GetStartJohConsultationRequest(Conference conference)
    {
        return Builder<StartPrivateConsultationRequest>.CreateNew()
            .With(x => x.ConferenceId = conference.Id)
            .With(x => x.RequestedBy = conference.Participants[1].Id)
            .With(x => x.RoomType = VirtualCourtRoomType.JudgeJOH)
            .Build();
    }
    
    public static StartPrivateConsultationRequest GetStartParticipantConsultationRequest(Conference conference)
    {
        return Builder<StartPrivateConsultationRequest>.CreateNew()
            .With(x => x.ConferenceId = conference.Id)
            .With(x => x.RequestedBy = conference.Participants[1].Id)
            .With(x => x.RoomType = VirtualCourtRoomType.Participant)
            .With(x => x.InviteParticipants = new[]
            {
                conference.Participants[2].Id,
                conference.Participants[3].Id
            })
            .With(x => x.InviteEndpoints = [])
            .Build();
    }
    
}
