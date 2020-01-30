using AcceptanceTests.Common.Configuration.Users;
using FizzWare.NBuilder;
using VideoWeb.Services.Bookings;

namespace VideoWeb.AcceptanceTests.Builders
{
    public class ParticipantsRequestBuilder
    {
        private ISingleObjectBuilder<ParticipantRequest> _request;
        private UserAccount _user;

        public ParticipantsRequestBuilder()
        {
            _request = Builder<ParticipantRequest>.CreateNew();
            _request.BuilderSettings.AutoNameProperties = false;
        }

        public ParticipantsRequestBuilder AddClerkOrJudge()
        {
            _request
                .With(x => x.Representee = "")
                .With(x => x.Solicitors_reference = "")
                .With(x => x.Case_role_name = "Judge")
                .With(x => x.Hearing_role_name = "Judge")
                .With(x => x.Organisation_name = "");

            _request = AddSharedProperties();

            return this;
        }

        public ParticipantsRequestBuilder AddIndividual()
        {
            _request
                .With(x => x.Case_role_name = _user.CaseRoleName)
                .With(x => x.Hearing_role_name = _user.HearingRoleName)
                .With(x => x.Solicitors_reference = _user.SolicitorsReference)
                .With(x => x.Representee = "")
                .With(x => x.Organisation_name = "")
                .With(x => x.House_number = "102")
                .With(x => x.Street = "Petty France")
                .With(x => x.Postcode = "SW1H 9AJ")
                .With(x => x.City = "London")
                .With(x => x.County = "Greater London");

            _request = AddSharedProperties();

            return this;
        }

        public ParticipantsRequestBuilder AddRepresentative()
        {
            _request = Builder<ParticipantRequest>.CreateNew()
                .With(x => x.Case_role_name = _user.CaseRoleName)
                .With(x => x.Hearing_role_name = _user.HearingRoleName)
                .With(x => x.Representee = _user.Representee)
                .With(x => x.Solicitors_reference = "")
                .With(x => x.Organisation_name = "MoJ");

            _request = AddSharedProperties();

            return this;
        }

        private ISingleObjectBuilder<ParticipantRequest> AddSharedProperties()
        {
            return _request
                .With(x => x.Contact_email = _user.AlternativeEmail)
                .With(x => x.Display_name = _user.DisplayName)
                .With(x => x.First_name = _user.Firstname)
                .With(x => x.Last_name = _user.Lastname)
                .With(x => x.Middle_names = "")
                .With(x => x.Telephone_number = $"+44(0)7{Faker.RandomNumber.Next(900000000, 999999999)}")
                .With(x => x.Title = "Mrs")
                .With(x => x.Username = _user.Username);
        }

        public ParticipantsRequestBuilder WithUser(UserAccount user)
        {
            _user = user;
            return this;
        }

        public ParticipantRequest Build()
        {
            return _request.Build();
        }
    }
}
