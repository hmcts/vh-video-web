using System;
using System.Collections.Generic;
using FizzWare.NBuilder;
using VideoApi.Contract.Enums;
using VideoApi.Contract.Responses;

namespace VideoWeb.UnitTests.Builders
{
    public class ParticipantSummaryResponseBuilder
    {
        private readonly ISingleObjectBuilder<ParticipantSummaryResponse> _participant;

        public ParticipantSummaryResponseBuilder(UserRole role)
        {
            _participant = Builder<ParticipantSummaryResponse>.CreateNew()
                .With(x => x.Id = Guid.NewGuid())
                .With(x => x.Status = ParticipantState.Available)
                .With(x => x.UserRole = role)
                .With(x => x.LinkedParticipants = new List<LinkedParticipantResponse>());
        }
        
        public ParticipantSummaryResponseBuilder WithStatus(ParticipantState state)
        {
            _participant.With(x => x.Status = state);
            return this;
        }
        
        public ParticipantSummaryResponse Build()
        {
            return _participant.Build();
        }
    }
}
