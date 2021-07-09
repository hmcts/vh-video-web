using System;
using System.Collections.Generic;
using System.Text;
using VideoWeb.Contract.Responses;

namespace VideoWeb.EventHub.Models
{
    public class ParticipantsUpdated
    {
        public IList<ParticipantUpdatedResponse> UpdatedParticipants { get; set; }
        public IList<ParticipantAddedResponse> AddedParticipants { get; set; }
        public IList<Guid> RemovedParticipants { get; set; }
        public IList<LinkedParticipantsResponse> LinkedParticipants { get; set; }
    }
}
