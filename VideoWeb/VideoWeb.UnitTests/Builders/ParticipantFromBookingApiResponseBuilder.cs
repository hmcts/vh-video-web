using System;
using BookingsApi.Contract.V1.Enums;
using BookingsApi.Contract.V1.Responses;
using BookingsApi.Contract.V2.Responses;
using FizzWare.NBuilder;
using VideoApi.Contract.Enums;

namespace VideoWeb.UnitTests.Builders
{
    public class ParticipantFromBookingApiResponseBuilder
    {
        private readonly ISingleObjectBuilder<ParticipantResponseV2> _participant;

        public ParticipantFromBookingApiResponseBuilder(Guid? id = null)
        {
            _participant = Builder<ParticipantResponseV2>.CreateNew()
                .With(x => x.Id = id ?? Guid.NewGuid())
                .With(x => x.UserRoleName = "Individual")
                .With(x => x.HearingRoleName = "Litigant in person")
                .With(x => x.DisplayName = "John Doe")
                .With(x => x.FirstName = "John")
                .With(x => x.LastName = "Doe")
                .With(x => x.ContactEmail = "john@doe.net")
                .With(x => x.TelephoneNumber = "0123456789")
                .With(x => x.Username = "john@username.com");
            
        }
        
        public ParticipantFromBookingApiResponseBuilder WithContactEmail(string email)
        {
            _participant.With(x => x.ContactEmail = email);
            return this;
        }
        
        public ParticipantFromBookingApiResponseBuilder WithUsername(string username)
        {
            _participant.With(x => x.Username = username);
            return this;
        }
        
        public ParticipantFromBookingApiResponseBuilder WithContactTelephone(string telephone)
        {
            _participant.With(x => x.TelephoneNumber = telephone);
            return this;
        }
        
        public ParticipantFromBookingApiResponseBuilder WithRoles(string userRole)
        {
            _participant.With(x => x.HearingRoleName = (userRole == "Individual") ? "Witness" : userRole);
            _participant.With(x => x.UserRoleName = userRole);
            return this;
        }
        
        public ParticipantFromBookingApiResponseBuilder WithInterpreterLanguage(string code, string value, InterpreterType type)
        {
            _participant.With(x => x.InterpreterLanguage = new InterpreterLanguagesResponse
            {
                Code = code,
                Value = value,
                Type = type
            });
            return this;
        }
        
        public ParticipantResponseV2 Build()
        {
            return _participant.Build();
        }
    }
}
