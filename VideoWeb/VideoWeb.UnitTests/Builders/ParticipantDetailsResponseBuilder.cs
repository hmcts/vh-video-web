using System;
using System.Collections.Generic;
using FizzWare.NBuilder;
using VideoApi.Contract.Enums;
using VideoApi.Contract.Responses;

namespace VideoWeb.UnitTests.Builders
{
    public class ParticipantDetailsResponseBuilder 
    {
        private readonly ISingleObjectBuilder<ParticipantDetailsResponse> _participant;

        public ParticipantDetailsResponseBuilder(UserRole role, string caseTypeGroup)
        {
            _participant = Builder<ParticipantDetailsResponse>.CreateNew()
                .With(x => x.Id = Guid.NewGuid())
                .With(x => x.CurrentStatus = ParticipantState.Available)
                .With(x => x.CaseTypeGroup = caseTypeGroup)
                .With(x => x.UserRole = role)
                .With(x=> x.LinkedParticipants = new List<LinkedParticipantResponse>());
        }

        public ParticipantDetailsResponseBuilder WithStatus(ParticipantState state)
        {
            _participant.With(x => x.CurrentStatus = state);
            return this;
        }

        public ParticipantDetailsResponseBuilder WithHearingRole(string hearingRole)
        {
            _participant.With(x => x.HearingRole = hearingRole);
            return this;
        }

        public ParticipantDetailsResponse Build()
        {
            return _participant.Build();
        }
    }
}
