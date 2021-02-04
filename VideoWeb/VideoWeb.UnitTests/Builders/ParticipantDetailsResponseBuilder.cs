using System;
using FizzWare.NBuilder;
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
                .With(x => x.UserRole = role);
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
