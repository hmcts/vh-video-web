using System;
using System.Collections.Generic;
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
                .With(x => x.Current_status = ParticipantState.Available)
                .With(x => x.Case_type_group = caseTypeGroup)
                .With(x => x.User_role = role)
                .With(x=> x.Linked_participants = new List<LinkedParticipantResponse>());
        }

        public ParticipantDetailsResponseBuilder WithStatus(ParticipantState state)
        {
            _participant.With(x => x.Current_status = state);
            return this;
        }

        public ParticipantDetailsResponseBuilder WithHearingRole(string hearingRole)
        {
            _participant.With(x => x.Hearing_role = hearingRole);
            return this;
        }

        public ParticipantDetailsResponse Build()
        {
            return _participant.Build();
        }
    }
}
