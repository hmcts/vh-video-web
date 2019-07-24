using VideoWeb.Services.Bookings;
using UpdateParticipantRequest = VideoWeb.Services.Bookings.UpdateParticipantRequest;

namespace VideoWeb.AcceptanceTests.Builders
{
    public class UpdateParticipantBuilder
    {
        private readonly UpdateParticipantRequest _request;

        private string _appendWord;
        private ParticipantResponse _participant;

        public UpdateParticipantBuilder()
        {
            _request = new UpdateParticipantRequest();
        }

        public UpdateParticipantBuilder ForParticipant(ParticipantResponse participant)
        {
            _participant = participant;
            return this;
        }

        public UpdateParticipantBuilder AddWordToStrings(string word)
        {
            _appendWord = word;
            return this;
        }

        public UpdateParticipantRequest Build()
        {
            _request.City = _participant.City;
            _request.County = _participant.County;
            _request.Display_name = $"{_appendWord} {_participant.Display_name}";
            _request.House_number = _participant.House_number;
            _request.Organisation_name = _participant.Organisation;
            _request.Postcode = _participant.Postcode;
            _request.Representee = _participant.Representee;
            _request.Solicitors_reference = _participant.Solicitor_reference;
            _request.Street = _participant.Street;
            _request.Telephone_number = _participant.Telephone_number;
            _request.Title = $"{_appendWord}";
            return _request;
        }
    }
}

