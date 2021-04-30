using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;

namespace VideoWeb.Common.Models
{
    public interface IConsultationInvitation
    {
        Guid InvitationId { get; }
        Guid RequestedForParticipantId { get; }
        ConcurrentDictionary<Guid, ConsultationAnswer> InvitedParticipantResponses { get; }
        bool HaveAllAccepted { get; }
        bool HaveAllResponded { get; }
        bool HasSomeoneRejected { get; }
    }

    public class ConsultationInvitation : IConsultationInvitation
    {
        public ConsultationInvitation(Guid requestedForParticipantId)
        {
            InvitationId = Guid.NewGuid();
            RequestedForParticipantId = requestedForParticipantId;
            
            InvitedParticipantResponses = new ConcurrentDictionary<Guid, ConsultationAnswer>();
            InvitedParticipantResponses.TryAdd(requestedForParticipantId, ConsultationAnswer.None);
        }
        
        public ConsultationInvitation(Guid requestedForParticipantId, IEnumerable<Guid> linkedParticipantIds)
        {
            InvitationId = Guid.NewGuid();
            RequestedForParticipantId = requestedForParticipantId;
            
            InvitedParticipantResponses = new ConcurrentDictionary<Guid, ConsultationAnswer>();
            InvitedParticipantResponses.TryAdd(requestedForParticipantId, ConsultationAnswer.None);
            foreach (var linkedParticipantId in linkedParticipantIds)
                InvitedParticipantResponses.TryAdd(linkedParticipantId, ConsultationAnswer.None);
        }

        public Guid InvitationId { get; private set; }
        public Guid RequestedForParticipantId { get; private set; }
        public ConcurrentDictionary<Guid, ConsultationAnswer> InvitedParticipantResponses { get; private set; }
        public bool HaveAllAccepted 
        {
            get
            {
                return InvitedParticipantResponses.Values.Aggregate(true, (state, x) => state == (state && x == ConsultationAnswer.Accepted));
            }
        } 
        public bool HaveAllResponded => InvitedParticipantResponses.Values.Aggregate(true, (state, x) => state == (state && x != ConsultationAnswer.None));
        public bool HasSomeoneRejected => InvitedParticipantResponses.Values.Aggregate(false, (state, x) => state == (state || x == ConsultationAnswer.Rejected || x == ConsultationAnswer.Failed));
    }
}
