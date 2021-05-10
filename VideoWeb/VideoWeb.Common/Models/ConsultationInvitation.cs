using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json;

namespace VideoWeb.Common.Models
{
    public class ConsultationInvitation
    {
        public static ConsultationInvitation Create(Guid requestedForParticipantId, string roomLabel, IEnumerable<Guid> linkedParticipantIds)
        {
            var invitation = new ConsultationInvitation
            {
                InvitationId = Guid.NewGuid(),
                RequestedForParticipantId = requestedForParticipantId,
                InvitedParticipantResponses = new ConcurrentDictionary<Guid, ConsultationAnswer>(),
                RoomLabel = roomLabel
            };

            invitation.InvitedParticipantResponses.TryAdd(requestedForParticipantId, ConsultationAnswer.None);
            foreach (var linkedParticipantId in linkedParticipantIds)
                invitation.InvitedParticipantResponses.TryAdd(linkedParticipantId, ConsultationAnswer.None);

            return invitation;
        }

        public Guid InvitationId { get; set; }
        public Guid RequestedForParticipantId { get; set; }
        public string RoomLabel { get; set; }
        public ConcurrentDictionary<Guid, ConsultationAnswer> InvitedParticipantResponses { get; set; }
        public bool HaveAllAccepted 
        {
            get
            {
                return InvitedParticipantResponses.Values.All(answer => answer == ConsultationAnswer.Accepted);
            }
        } 
        public bool HaveAllResponded => InvitedParticipantResponses.Values.All(answer => answer != ConsultationAnswer.None);
        public bool HasSomeoneRejected => InvitedParticipantResponses.Values.Any(answer => answer == ConsultationAnswer.Rejected || answer == ConsultationAnswer.Failed);
    }
}
