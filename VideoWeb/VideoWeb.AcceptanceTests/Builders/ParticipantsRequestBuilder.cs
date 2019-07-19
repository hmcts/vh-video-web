using FizzWare.NBuilder;
using Testing.Common.Configuration;
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
        }

        public ParticipantsRequestBuilder AddClerkOrJudge()
        {
            _request
                .With(x => x.Representee = "")
                .With(x => x.Solicitors_reference = "")
                .With(x => x.Case_role_name = "Judge")
                .With(x => x.Hearing_role_name = "Judge")
                .With(x => x.Organisation_name = "");

            _request = RemoveAddress(_request);
            _request = AddUser();

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

            _request = AddUser();

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

            _request = RemoveAddress(_request);
            _request = AddUser();

            return this;
        }

        private ISingleObjectBuilder<ParticipantRequest> AddUser()
        {
            return _request
                .With(x => x.Contact_email = _user.AlternativeEmail)
                .With(x => x.Display_name = _user.Displayname)
                .With(x => x.First_name = _user.Firstname)
                .With(x => x.Last_name = _user.Lastname)
                .With(x => x.Middle_names = "")
                .With(x => x.Telephone_number = "01234567890")
                .With(x => x.Telephone_number = $"+44(0)7{Faker.RandomNumber.Next(900000000, 999999999)}")
                .With(x => x.Title = "Mrs")
                .With(x => x.Username = _user.Username);
        }

        private static ISingleObjectBuilder<ParticipantRequest> RemoveAddress(ISingleObjectBuilder<ParticipantRequest> request)
        {
            return request
                .With(x => x.House_number = "")
                .With(x => x.Street = "")
                .With(x => x.Postcode = "")
                .With(x => x.City = "")
                .With(x => x.County = "");
        }

        public ParticipantsRequestBuilder ForUser(UserAccount user)
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
