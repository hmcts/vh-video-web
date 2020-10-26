using System;
using FizzWare.NBuilder;
using VideoWeb.Services.Video;

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
                .With(x => x.User_role = role);
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
