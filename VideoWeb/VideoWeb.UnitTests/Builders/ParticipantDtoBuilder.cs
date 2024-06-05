using System;
using System.Collections.Generic;
using FizzWare.NBuilder;
using VideoApi.Contract.Responses;
using VideoWeb.Common.Models;

namespace VideoWeb.UnitTests.Builders
{
    public class ParticipantBuilder
    {
        private readonly ISingleObjectBuilder<ParticipantDto> _participant;

        public ParticipantBuilder(Role role, string caseTypeGroup)
        {
            _participant = Builder<ParticipantDto>.CreateNew()
                .With(x => x.Id = Guid.NewGuid())
                .With(x => x.RefId = Guid.NewGuid())
                .With(x => x.ParticipantStatus = ParticipantStatus.Available)
                .With(x => x.CaseTypeGroup = caseTypeGroup)
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

        public ParticipantDto Build()
        {
            return _participant.Build();
        }
    }
}
