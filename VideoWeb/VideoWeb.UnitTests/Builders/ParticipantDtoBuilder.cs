using System;
using System.Collections.Generic;
using FizzWare.NBuilder;
using VideoApi.Contract.Responses;
using VideoWeb.Common.Models;

namespace VideoWeb.UnitTests.Builders
{
    public class ParticipantBuilder
    {
        private readonly ISingleObjectBuilder<Participant> _participant;

        public ParticipantBuilder(Role role)
        {
            _participant = Builder<Participant>.CreateNew()
                .With(x => x.Id = Guid.NewGuid())
                .With(x => x.RefId = Guid.NewGuid())
                .With(x => x.ParticipantStatus = ParticipantStatus.Available)
                .With(x => x.Role = role)
                .With(x => x.LinkedParticipants = new List<LinkedParticipant>
                    { new () { LinkedId = Guid.NewGuid(), LinkType = LinkType.Interpreter } });
        }

        public ParticipantBuilder WithStatus(ParticipantStatus state)
        {
            _participant.With(x => x.ParticipantStatus = state);
            return this;
        }

        public ParticipantBuilder WithHearingRole(string hearingRole)
        {
            _participant.With(x => x.HearingRole = hearingRole);
            return this;
        }
        
        public ParticipantBuilder WithInterpreterLanguage(InterpreterLanguage interpreterLanguage)
        {
            _participant.With(x => x.InterpreterLanguage = interpreterLanguage);
            return this;
        }

        public Participant Build()
        {
            return _participant.Build();
        }
    }
}
