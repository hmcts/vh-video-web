using System;
using FizzWare.NBuilder;
using VideoWeb.Services.Video;

namespace Testing.Common.Builders
{
    public class ParticipantDetailsResponseBuilder 
    {
        private readonly ISingleObjectBuilder<ParticipantDetailsResponse> _participant;

        public ParticipantDetailsResponseBuilder(UserRole role)
        {
            _participant = Builder<ParticipantDetailsResponse>.CreateNew()
                .With(x => x.Id = Guid.NewGuid())
                .With(x => x.Current_status = new ParticipantStatusResponse
                {
                    Participant_state = ParticipantState.Available,
                    Time_stamp = DateTime.UtcNow
                })
                .With(x => x.User_role = role);
        }

        public ParticipantDetailsResponseBuilder WithStatus(ParticipantState state)
        {
            _participant.With(x => x.Current_status = new ParticipantStatusResponse
            {
                Participant_state = ParticipantState.Available,
                Time_stamp = DateTime.UtcNow
            });
            return this;
        }

        public ParticipantDetailsResponse Build()
        {
            return _participant.Build();
        }
    }
}