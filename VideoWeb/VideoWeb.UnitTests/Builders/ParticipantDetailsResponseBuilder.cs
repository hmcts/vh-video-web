using System;
using System.Collections.Generic;
using FizzWare.NBuilder;
using VideoApi.Contract.Enums;
using VideoApi.Contract.Responses;

namespace VideoWeb.UnitTests.Builders
{
    public class ParticipantResponseBuilder
    {
        private readonly ISingleObjectBuilder<ParticipantResponse> _participant;

        public ParticipantResponseBuilder(UserRole role)
        {
            _participant = Builder<ParticipantResponse>.CreateNew()
                .With(x => x.Id = Guid.NewGuid())
                .With(x => x.RefId = Guid.NewGuid())
                .With(x => x.CurrentStatus = ParticipantState.Available)
                .With(x => x.UserRole = role)
                .With(x => x.LinkedParticipants = new List<LinkedParticipantResponse>
                    { new () { LinkedId = Guid.NewGuid(), Type = LinkedParticipantType.Interpreter } });
        }

        public ParticipantResponseBuilder WithStatus(ParticipantState state)
        {
            _participant.With(x => x.CurrentStatus = state);
            return this;
        }

        public ParticipantResponse Build()
        {
            return _participant.Build();
        }
    }
}
